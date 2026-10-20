#!/usr/bin/env python3
"""Build a standalone classroom animation. Python standard library only."""
import argparse
import base64
import html
import json
import math
from pathlib import Path
import re
import tempfile
import os


def number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def validate(data):
    if not isinstance(data, dict):
        raise ValueError("lesson must be an object")
    for key in ("title", "subtitle", "modelNote"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError(f"{key}: nonempty text required")
    duration = data.get("duration")
    if not number(duration) or not 1 <= duration <= 3600:
        raise ValueError("duration must be 1..3600 seconds")
    params = data.setdefault("parameters", [])
    if not isinstance(params, list):
        raise ValueError("parameters must be a list")
    keys = {}
    for p in params:
        if not isinstance(p, dict) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", p.get("key", "")):
            raise ValueError("parameter key must be a simple identifier")
        if p["key"] in keys or p["key"] in ("constructor", "prototype", "__proto__"):
            raise ValueError("duplicate or reserved parameter key")
        if not isinstance(p.get("label"), str) or not isinstance(p.get("unit", ""), str):
            raise ValueError("parameter label/unit must be text")
        if not all(number(p.get(k)) for k in ("min", "max", "step", "value")):
            raise ValueError("parameter min/max/step/value must be finite numbers")
        if not p["min"] < p["max"] or p["step"] <= 0:
            raise ValueError("invalid parameter range")
        keys[p["key"]] = p

    def valid_value(key, value):
        p = keys.get(key)
        if p is None or not number(value) or not p["min"] <= value <= p["max"]:
            raise ValueError(f"parameter {key}: value outside range")
        step = (value - p["min"]) / p["step"]
        if abs(step-round(step)) > 1e-7:
            raise ValueError(f"parameter {key}: value must align to step")

    for p in params:
        valid_value(p["key"], p["value"])
    stages = data.get("stages")
    if not isinstance(stages, list) or not stages:
        raise ValueError("at least one stage required")
    previous = -1
    for i, s in enumerate(stages):
        if not isinstance(s, dict):
            raise ValueError("stage must be an object")
        at = s.get("at")
        if not number(at) or not previous < at < duration or (i == 0 and at != 0):
            raise ValueError("stages must start at 0 and increase before duration")
        previous = at
        for k in ("title", "question", "explanation", "narration"):
            if not isinstance(s.get(k), str):
                raise ValueError(f"stage {i}: {k} must be text")
        if not isinstance(s.get("values", {}), dict):
            raise ValueError("stage values must be an object")
        if 'audioFile' in s and not isinstance(s['audioFile'], str):
            raise ValueError('audioFile must be a relative filename')
        if 'audioDuration' in s and (not number(s['audioDuration']) or s['audioDuration'] <= 0):
            raise ValueError('audioDuration must be positive')
        for k, v in s.get("values", {}).items():
            valid_value(k, v)
    for i, s in enumerate(stages):
        end = stages[i+1]['at'] if i+1 < len(stages) else duration
        if s.get('audioDuration', 0) > end-s['at']+0.001:
            raise ValueError('stage is shorter than its narration; extend the stage')
    if not isinstance(data.setdefault("sources", []), list):
        raise ValueError("sources must be a list")
    for s in data["sources"]:
        if not isinstance(s, dict) or not isinstance(s.get("label"), str) or not isinstance(s.get("url"), str):
            raise ValueError("source needs label and url")
        if not re.match(r"^https?://[^\s]+$", s["url"]):
            raise ValueError("source URL must be http(s)")
    return data


def build(lesson, scene, out, force=False):
    data = validate(json.loads(Path(lesson).read_text(encoding="utf-8")))
    for stage in data['stages']:
        if 'audioFile' in stage:
            base = Path(lesson).resolve().parent
            source = (base / stage['audioFile']).resolve()
            if not source.is_relative_to(base):
                raise ValueError("audioFile must stay within the lesson folder")
            mime = {'.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4','.ogg':'audio/ogg'}.get(source.suffix.lower())
            if not mime or source.stat().st_size > 10_000_000:
                raise ValueError("unsupported or oversized audioFile")
            stage['audio'] = 'data:'+mime+';base64,'+base64.b64encode(source.read_bytes()).decode('ascii')
    code = Path(scene).read_text(encoding="utf-8")
    if not re.search(r"\bfunction\s+createExperiment\s*\(", code):
        raise ValueError("scene must define function createExperiment(svg)")
    if re.search(r"</script", code, re.I):
        raise ValueError("scene must not contain a closing script tag")
    payload = json.dumps(data, ensure_ascii=False).replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
    template = (Path(__file__).resolve().parent.parent / "assets/player.html").read_text(encoding="utf-8")
    replacements = {"TITLE": html.escape(data["title"]), "LESSON_JSON": payload, "SCENE_JS": code}
    result = re.sub(r"@@(TITLE|LESSON_JSON|SCENE_JS)@@", lambda m: replacements[m[1]], template)
    out = Path(out)
    if out.exists() and not force:
        raise FileExistsError(f"{out} exists; use --force only for an intended revision")
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=out.parent, delete=False) as temp:
        temp.write(result)
        name = temp.name
    try:
        if force:
            os.replace(name, out)
        else:
            os.link(name, out)
    finally:
        if os.path.exists(name):
            os.unlink(name)
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson", required=True)
    parser.add_argument("--scene", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    try:
        print(build(args.lesson, args.scene, args.out, args.force))
    except (ValueError, OSError) as exc:
        parser.exit(1, f"Build failed: {exc}\n")


if __name__ == "__main__":
    main()
