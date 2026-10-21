#!/usr/bin/env node
// SVG scene -> deterministic raster frames -> H.264/AAC MP4. No browser capture.
const fs = require('node:fs'), path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const {Resvg} = require('@resvg/resvg-js');
const {makeScene, frameSVG} = require('./video-core.cjs');

function run(command, args) {
  const r = spawnSync(command, args, {encoding:'utf8', maxBuffer:16*1024*1024});
  if (r.error || r.status !== 0) throw Error(`${command}: ${r.error?.message || r.stderr}`);
  return r.stdout;
}
function probe(file) { return JSON.parse(run('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',file])); }

async function main() {
  const args = {};
  for (let i=2;i<process.argv.length;i++) {
    const key=process.argv[i];
    if (['--force','--silent'].includes(key)) args[key]=true;
    else if (key==='--font') (args[key] ||= []).push(process.argv[++i]);
    else if (['--lesson','--scene','--out','--font-family','--fps','--width','--height'].includes(key)) args[key]=process.argv[++i];
    else throw Error(`Unknown argument: ${key}`);
  }
  if (!args['--lesson'] || !args['--scene'] || !args['--out'])
    throw Error('Usage: node export_video.cjs --lesson lesson.json --scene scene.js --out animation.mp4 [--font font.ttf --font-family name] [--silent] [--force]');
  const output=path.resolve(args['--out']), lessonPath=path.resolve(args['--lesson']);
  if (path.extname(output).toLowerCase()!=='.mp4') throw Error('Output must be .mp4');
  if (fs.existsSync(output) && !args['--force']) throw Error('Output exists; use --force only for an intended revision');
  const width=Number(args['--width'] || 1920), height=Number(args['--height'] || 1080), fps=Number(args['--fps'] || 30);
  if (![width,height,fps].every(Number.isInteger) || width<320 || width>3840 || height<180 || height>2160 || width%2 || height%2 || width/height!==16/9 || fps<1 || fps>60) throw Error('Use even 16:9 dimensions and integer fps 1..60');
  // Reuse the HTML builder's scientific stage/parameter schema validation.
  run(process.env.PYTHON || 'python3', ['-c', 'import sys,json; sys.path.insert(0,sys.argv[1]); from build import validate; validate(json.load(open(sys.argv[2],encoding="utf-8")))', __dirname, lessonPath]);
  const lesson=JSON.parse(fs.readFileSync(lessonPath,'utf8'));
  const inputs=[], filters=[], labels=[];
  if (!args['--silent']) for (let i=0;i<lesson.stages.length;i++) {
    const stage=lesson.stages[i];
    if (!stage.audioFile) throw Error(`Stage ${i+1} has no narration audio. Generate narration, or use --silent only when requested.`);
    const file=fs.realpathSync(path.resolve(path.dirname(lessonPath),stage.audioFile));
    const base=fs.realpathSync(path.dirname(lessonPath));
    if (!file.startsWith(base+path.sep)) throw Error('audioFile must stay inside lesson folder');
    const info=probe(file);
    if (!info.streams.some(s=>s.codec_type==='audio')) throw Error('Missing audio stream');
    const duration=Number(info.format.duration), end=lesson.stages[i+1]?.at ?? lesson.duration;
    if (!Number.isFinite(duration) || duration<=0 || duration>end-stage.at+0.06) throw Error(`Stage ${i+1} audio exceeds stage duration`);
    stage.audioDuration=duration;
    inputs.push('-i',file);
    filters.push(`[${i+1}:a]aresample=48000,asetpts=PTS-STARTPTS,adelay=${Math.round(stage.at*1000)}:all=1[a${i}]`);
    labels.push(`[a${i}]`);
  }
  const render=makeScene(fs.readFileSync(args['--scene'],'utf8'));
  const fontFamily=args['--font-family'] || 'sans-serif';
  const font={loadSystemFonts:!args['--font'],defaultFontFamily:fontFamily};
  if(args['--font']) font.fontFiles=args['--font'].map(file=>path.resolve(file));
  fs.mkdirSync(path.dirname(output),{recursive:true});
  const temp=fs.mkdtempSync(path.join(path.dirname(output),'.video-export-'));
  let encoder,done;
  try {
    const video=path.join(temp,'animation.mp4');
    const ffargs=['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0',...inputs];
    if (labels.length) {
      filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0,apad,atrim=0:${lesson.duration}[voice]`);
      ffargs.push('-filter_complex',filters.join(';'),'-map','0:v:0','-map','[voice]','-c:a','aac','-b:a','192k','-ar','48000','-ac','2');
    } else ffargs.push('-map','0:v:0','-an');
    ffargs.push('-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r',String(fps),'-t',String(lesson.duration),'-movflags','+faststart',video);
    encoder=spawn('ffmpeg',ffargs,{stdio:['pipe','ignore','pipe']});
    let stderr='';encoder.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-12000);});
    let inputError;encoder.stdin.on('error',e=>{inputError=e;});
    done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error(stderr || `ffmpeg exit ${code}`)));});
    done.catch(()=>{});
    const count=Math.ceil(lesson.duration*fps);
    const snapshots=new Set([0,...lesson.stages.map(s=>Math.min(count-1,Math.round((s.at+2)*fps))),count-1]);
    for(let frame=0;frame<count;frame++) {
      if(inputError) throw inputError;
      const svg=frameSVG(lesson,render,frame/fps,{width,height,fontFamily});
      const png=new Resvg(svg,{font}).render().asPng();
      if(snapshots.has(frame)) fs.writeFileSync(path.join(temp,`frame-${frame}.png`),png);
      if(!encoder.stdin.write(png)) await once(encoder.stdin,'drain');
      if(frame%(fps*5)===0) console.log(`Rendered ${frame}/${count} frames (${Math.round(100*frame/count)}%)`);
    }
    encoder.stdin.end();await done;
    const metadata=probe(video),v=metadata.streams.find(s=>s.codec_type==='video'),a=metadata.streams.find(s=>s.codec_type==='audio');
    if(v?.codec_name!=='h264'||v.width!==width||v.height!==height||v.pix_fmt!=='yuv420p'||Math.abs(Number(metadata.format.duration)-lesson.duration)>0.1||(!args['--silent']&&a?.codec_name!=='aac')) throw Error('MP4 format verification failed');
    run('ffmpeg',['-v','error','-xerror','-i',video,'-f','null','-']);
    const qa=output.slice(0,-4)+'.qa';fs.mkdirSync(qa,{recursive:true});
    for(const file of fs.readdirSync(temp)) if(file.endsWith('.png')) fs.copyFileSync(path.join(temp,file),path.join(qa,file));
    fs.writeFileSync(path.join(qa,'verification.json'),JSON.stringify({duration:lesson.duration,width,height,fps,frames:count,videoCodec:v.codec_name,audioCodec:a?.codec_name || null,pixelFormat:v.pix_fmt,fullDecode:'passed',renderer:'SVG/resvg offline, no browser',subtitleTiming:'phrase-length proportional; not forced alignment',visualReview:'pending',listeningReview:'pending',powerPointInsertion:'not tested'},null,2)+'\n');
    if(args['--force']) fs.renameSync(video,output);
    else {fs.linkSync(video,output);fs.unlinkSync(video);}
    console.log(`Created ${output}`);
  } finally {
    if(encoder && encoder.exitCode===null) {encoder.kill();await done.catch(()=>{});}
    fs.rmSync(temp,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
