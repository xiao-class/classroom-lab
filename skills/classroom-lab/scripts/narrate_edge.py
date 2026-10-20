#!/usr/bin/env python3
"""Generate classroom narration with Edge online TTS; run by the agent."""
import argparse
import asyncio
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

from build import validate


async def generate(args, lessons, temporary):
    import edge_tts
    semaphore = asyncio.Semaphore(3)

    async def one(lesson_index, stage_index, text):
        raw = temporary / f"{lesson_index}-{stage_index}-raw.mp3"
        output = temporary / f"{lesson_index}-{stage_index}.mp3"
        async with semaphore:
            for attempt in range(2):
                try:
                    await asyncio.wait_for(
                        edge_tts.Communicate(text, args.voice, rate=args.rate).save(str(raw)),
                        timeout=45,
                    )
                    break
                except Exception:
                    if attempt == 1:
                        raise
                    await asyncio.sleep(1)
            subprocess.run([
                "ffmpeg", "-v", "error", "-y", "-i", str(raw),
                "-af", "loudnorm=I=-18:TP=-2:LRA=7",
                "-ar", "24000", "-ac", "1", "-b:a", "64k", str(output),
            ], check=True)
            duration = float(subprocess.check_output([
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=nw=1:nk=1", str(output),
            ], text=True))
            if not math.isfinite(duration) or duration <= 0:
                raise ValueError("Generated narration has no valid duration")
            print(f"Generated lesson {lesson_index+1}, stage {stage_index+1}: {duration:.2f}s", flush=True)
            return lesson_index, stage_index, output, duration

    return await asyncio.gather(*(
        one(i, j, stage["narration"])
        for i, (_, data) in enumerate(lessons)
        for j, stage in enumerate(data["stages"])
    ))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson", required=True, action="append")
    parser.add_argument("--voice", default="zh-CN-XiaoxiaoNeural")
    parser.add_argument("--rate", default="+5%")
    parser.add_argument("--force", action="store_true", help="Replace existing narration for this revision")
    args = parser.parse_args()
    if not re.fullmatch(r"[+-]\d+%", args.rate) or abs(int(args.rate[:-1])) > 50:
        parser.error("rate must be a signed percentage between -50% and +50%")
    for binary in ("ffmpeg", "ffprobe"):
        if not shutil.which(binary):
            parser.error(f"{binary} unavailable")
    lessons = []
    seen = set()
    for value in args.lesson:
        path = Path(value).resolve()
        if path in seen:
            parser.error("The same lesson was supplied twice")
        seen.add(path)
        data = validate(json.loads(path.read_text(encoding="utf-8")))
        for stage in data["stages"]:
            if not isinstance(stage.get("narration"), str) or not stage["narration"].strip():
                parser.error("Every stage needs non-empty narration")
        audio = path.parent / "audio"
        if not audio.resolve().is_relative_to(path.parent):
            parser.error("Audio output must stay inside the lesson folder")
        if not args.force and any((audio / f"stage-{i+1}.mp3").exists() for i in range(len(data["stages"]))):
            parser.error("Narration exists; use --force for an intended revision")
        lessons.append((path, data))
    # Finish all network requests before replacing any existing lesson audio.
    with tempfile.TemporaryDirectory(prefix="classroom-narration-") as directory:
        results = asyncio.run(generate(args, lessons, Path(directory)))
        for lesson_index, (path, data) in enumerate(lessons):
            original = [s["at"] for s in data["stages"]] + [data["duration"]]
            elapsed, report = 0, []
            (path.parent / "audio").mkdir(exist_ok=True)
            for _, stage_index, source, duration in (r for r in results if r[0] == lesson_index):
                stage = data["stages"][stage_index]
                destination = path.parent / "audio" / f"stage-{stage_index+1}.mp3"
                shutil.copy2(source, destination)
                stage.update(at=elapsed, audioFile=f"audio/{destination.name}", audioDuration=round(duration, 3))
                elapsed += max(original[stage_index+1] - original[stage_index], math.ceil(duration + 1))
                report.append({"stage": stage_index, "file": stage["audioFile"], "duration": duration})
            data.update(duration=elapsed, narrationVoice=args.voice)
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            (path.parent / "audio/generation.json").write_text(json.dumps({
                "backend": "Edge online TTS via edge-tts", "voice": args.voice, "rate": args.rate,
                "stages": report, "generationRequiresNetwork": True,
                "playbackRequiresNetwork": False, "privateVoiceModelUsed": False,
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"Updated {path.name}: {elapsed}s", flush=True)


if __name__ == "__main__":
    main()
