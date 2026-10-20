#!/usr/bin/env python3
"""Optional local Mandarin narration helper for agents on macOS; no API key."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lesson', required=True)
    p.add_argument('--voice', default='Tingting')
    p.add_argument('--rate', type=int, default=190)
    args=p.parse_args()
    if not 100 <= args.rate <= 300:
        p.error('rate must be 100..300')
    for binary in ['say','ffmpeg','ffprobe']:
        if not shutil.which(binary):p.error(f'{binary} unavailable; use another available TTS backend instead')
    lesson=Path(args.lesson).resolve(); data=json.loads(lesson.read_text())
    audio_dir=lesson.parent/'audio';audio_dir.mkdir(exist_ok=True)
    original_starts=[s['at'] for s in data['stages']]+[data['duration']]
    elapsed=0;report=[]
    with tempfile.TemporaryDirectory() as tmp:
        for i,s in enumerate(data['stages']):
            text=Path(tmp)/'text.txt';text.write_text(s['narration'],encoding='utf-8')
            raw=Path(tmp)/'speech.aiff';mp3=audio_dir/f'stage-{i+1}.mp3'
            subprocess.run(['say','-v',args.voice,'-r',str(args.rate),'-f',str(text),'-o',str(raw)],check=True)
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar','24000','-ac','1','-b:a','64k',str(mp3)],check=True)
            duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(mp3)],text=True))
            s['at']=round(elapsed,3);s['audioFile']=str(mp3.relative_to(lesson.parent));s['audioDuration']=round(duration,3)
            elapsed+=max(original_starts[i+1]-original_starts[i],duration+1.0)
            report.append({'stage':i,'voice':args.voice,'duration':duration,'file':s['audioFile']})
    data['duration']=round(elapsed,3)
    data['narrationVoice']=args.voice+'（macOS系统普通话）'
    lesson.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (audio_dir/'generation.json').write_text(json.dumps({'backend':'macOS say','voice':args.voice,'rate':args.rate,'stages':report},ensure_ascii=False,indent=2))
    print(json.dumps({'lesson':str(lesson),'duration':data['duration'],'clips':report},ensure_ascii=False))

if __name__=='__main__':main()
