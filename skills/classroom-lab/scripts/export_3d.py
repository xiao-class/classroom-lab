#!/usr/bin/env python3
"""Render actual 3D teaching MP4 with native SceneKit/Metal on macOS.
No browser capture. The included recipes are examples, not a universal simulator.
"""
import argparse,hashlib,json,math,os,platform,shutil,subprocess,sys,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE/'native-3d'))
from models import state,params_at
from build import validate

def run(args,**kwargs):
    return subprocess.run([str(x) for x in args],check=True,**kwargs)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))

def prepare(path):
    path=Path(path).resolve();lesson=json.loads(path.read_text());validate(lesson)
    kind=lesson.get('sceneType');expected={'lever':3,'pendulum':3,'refraction':4,'dissolution':4,'mitosis':4}
    if kind not in expected or len(lesson['stages'])!=expected[kind]:raise ValueError('Use a supported 3D recipe, or implement and verify a new model and scene.')
    if lesson['stages'][0]['at']!=0:raise ValueError('First stage must begin at zero')
    if kind in ('dissolution','mitosis') and (lesson['parameters'] or any(s.get('values') for s in lesson['stages'])):raise ValueError('Life recipes are qualitative fixed-content models; implement parameter effects before adding controls')
    audio=[]
    for i,s in enumerate(lesson['stages']):
        p=params_at(lesson,i)
        limits={'lever':{'leftMass':(50,200),'rightMass':(50,200),'distance':(10,40)},'pendulum':{'length':(.5,1.0),'mass':(50,200)},'refraction':{'angle':(0,75)},'dissolution':{},'mitosis':{}}[kind]
        for key,(low,high) in limits.items():
            if key not in p or not low<=p[key]<=high:raise ValueError(f'{key} is outside the verified geometry envelope {low}..{high}; adapt the 3D scene first')
        if not s.get('audioFile'):raise ValueError(f'Stage {i+1} has no narration')
        file=(path.parent/s['audioFile']).resolve()
        if path.parent not in file.parents:raise ValueError('Audio must stay within the lesson directory')
        info=probe(file);duration=float(info['format']['duration']);end=lesson['stages'][i+1]['at'] if i+1<len(lesson['stages']) else lesson['duration']
        if not any(x['codec_type']=='audio' for x in info['streams']) or duration<=0 or duration>end-s['at']+.05:raise ValueError(f'Stage {i+1}: invalid or overflowing audio')
        s['audioDuration']=duration
        audio.append({'path':file,'at':s['at'],'duration':duration,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    return lesson,audio

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--lesson',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);ap.add_argument('--force',action='store_true');ap.add_argument('--fps',type=int,default=30);ap.add_argument('--preview',help='Comma-separated seconds: save still PNGs instead of an MP4');args=ap.parse_args()
    if platform.system()!='Darwin':raise RuntimeError('This backend needs macOS, Metal and Swift. Use a permitted native 3D backend on other systems; do not silently flatten to SVG.')
    if args.fps<1 or args.fps>60:raise ValueError('fps must be 1..60')
    out=args.out.resolve()
    if out.exists() and not args.force:raise FileExistsError('Output exists; use --force for an intended revision')
    if not args.preview and out.suffix.lower()!='.mp4':raise ValueError('Output must be MP4')
    for command in ['xcrun','ffmpeg','ffprobe']:
        if not shutil.which(command):raise RuntimeError(f'Missing {command}; the assistant must prepare the rendering environment')
    lesson,audio=prepare(args.lesson)
    times=[float(x) for x in args.preview.split(',')] if args.preview else [i/args.fps for i in range(math.ceil(lesson['duration']*args.fps))]
    if any(not math.isfinite(t) or t<0 or t>=lesson['duration'] for t in times):raise ValueError('Preview times must be within the lesson')
    out.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.native-3d-',dir=out.parent) as tmp:
        tmp=Path(tmp);exe=tmp/'renderer'
        run(['xcrun','swiftc','-O',HERE/'native-3d/Render.swift','-o',exe])
        timeline=tmp/'frames.json';timeline.write_text(json.dumps({'title':lesson['title'],'sceneType':lesson['sceneType'],'frames':[state(lesson,t) for t in times]},ensure_ascii=False))
        if args.preview:
            shots=tmp/'stills';shots.mkdir();run([exe,timeline,shots]);out.mkdir(parents=True,exist_ok=True)
            for p in shots.iterdir():shutil.copy2(p,out/p.name)
            shutil.copy2(timeline,out/'states.json');print('Preview:',out);return
        target=tmp/'animation.mp4';ff=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','1920x1080','-framerate',str(args.fps),'-i','pipe:0']
        for a in audio:ff+=['-i',str(a['path'])]
        filters=[f'[{i+1}:a]aresample=48000,asetpts=PTS-STARTPTS,adelay={round(a["at"]*1000)}:all=1[a{i}]' for i,a in enumerate(audio)]
        filters+=[''.join(f'[a{i}]' for i in range(len(audio)))+f'amix=inputs={len(audio)}:normalize=0,apad,atrim=0:{lesson["duration"]}[voice]']
        ff+=['-filter_complex',';'.join(filters),'-map','0:v:0','-map','[voice]','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',str(lesson['duration']),'-movflags','+faststart',str(target)]
        encoder=None;render=None
        try:
            encoder=subprocess.Popen(ff,stdin=subprocess.PIPE)
            render=subprocess.Popen([str(exe),str(timeline)],stdout=encoder.stdin)
            encoder.stdin.close();rcode=render.wait();ecode=encoder.wait()
            if rcode or ecode:raise RuntimeError(f'3D renderer={rcode}, encoder={ecode}; old output preserved')
        finally:
            for child in [render,encoder]:
                if child and child.poll() is None:child.terminate();child.wait()
        info=probe(target);v=next(x for x in info['streams'] if x['codec_type']=='video');a=next(x for x in info['streams'] if x['codec_type']=='audio')
        if (v['codec_name'],v['width'],v['height'],v['pix_fmt'],a['codec_name'])!=('h264',1920,1080,'yuv420p','aac'):raise RuntimeError('Unexpected output format')
        if abs(float(info['format']['duration'])-lesson['duration'])>.1 or int(v['nb_frames'])!=len(times):raise RuntimeError('Incomplete video')
        run(['ffmpeg','-v','error','-xerror','-i',target,'-f','null','-'])
        qa=out.with_suffix('.qa');qa.mkdir(exist_ok=True)
        for t in [0,3,10,14,18,26,30,lesson['duration']-.1]:
            if t>=lesson['duration']:continue
            run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',target,'-frames:v','1','-update','1',qa/f'{t:05.1f}s.jpg'])
        report={'renderer':'Native SceneKit/Metal true 3D meshes, PBR materials, camera and lights','browserCapture':False,'sceneType':lesson['sceneType'],'frames':len(times),'fps':args.fps,'width':1920,'height':1080,'duration':float(info['format']['duration']),'videoCodec':v['codec_name'],'audioCodec':a['codec_name'],'fullDecode':'passed','audio':[dict(x,path=str(x['path'].relative_to(args.lesson.resolve().parent))) for x in audio],'subtitleTiming':'phrase length proportional within probed narration duration; not forced aligned','visualReview':'pending','listeningReview':'pending','powerPointInsertion':'not tested','sourceSha256':hashlib.sha256((HERE/'native-3d/Render.swift').read_bytes()).hexdigest()}
        (qa/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        if args.force:os.replace(target,out)
        else:os.link(target,out)
        print('Created:',out,flush=True)

if __name__=='__main__':
    try:main()
    except (ValueError,RuntimeError,OSError,subprocess.CalledProcessError) as e:sys.exit(str(e))
