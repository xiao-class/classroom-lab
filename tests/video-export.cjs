const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {stateAt,captionAt,makeScene}=require('../skills/classroom-lab/scripts/video-core.cjs');
const script=path.resolve(__dirname,'../skills/classroom-lab/scripts/export_video.cjs');
const timeline={parameters:[{key:'mass',value:1},{key:'distance',value:2}],stages:[{at:0},{at:1,values:{mass:3}},{at:2,values:{distance:4}}]};
test('seek applies cumulative parameter presets independently of traversal',()=>{
 assert.deepEqual(stateAt(timeline,2.1).params,{mass:3,distance:4});
 assert.deepEqual(stateAt(timeline,.5).params,{mass:1,distance:2});
 assert.equal(stateAt(timeline,1).stageIndex,1);
 assert.equal(stateAt(timeline,1).localTime,0);
});
test('SVG mutation is deterministic and WebGL is not silently flattened',()=>{
 const render=makeScene('function createExperiment(svg){svg.innerHTML=`<circle id="dot" r="10"/>`;return {check(){return []},render(s){svg.querySelector("#dot").setAttribute("cx",s.time*10)}}}');
 const first=render({time:1});render({time:2});assert.equal(render({time:1}),first);
 assert.throws(()=>makeScene('function createExperiment(svg){return Lab3D.createStage(svg)}'),/SVG scenes only/);
  const gradient=makeScene('function createExperiment(svg){return {check(){},render(){svg.innerHTML=`<defs><radialGradient id="g"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></radialGradient></defs><rect width="30" height="30" fill="url(#g)"/>`}}}');
  const xml=gradient({time:0});assert(xml.includes('radialGradient'));assert(!xml.includes('<rect width="30" height="30" fill="url(#g)"><'));
 assert.equal(captionAt({narration:'你好。再见。',audioDuration:2},2),'');
});
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;}
test('actual MP4 audio starts at the intended stages, and missing narration fails',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'classroom-video-test-'));
 try{
  for(const [name,freq] of [['one',660],['two',880]])run('ffmpeg',['-v','error','-f','lavfi','-i',`sine=frequency=${freq}:duration=0.25`,'-y',path.join(dir,name+'.wav')]);
  const lesson={title:'Video test',subtitle:'Timing',modelNote:'Synthetic test',duration:2,parameters:[],stages:[{at:0,title:'One',question:'Observe',explanation:'',narration:'One',audioFile:'one.wav',audioDuration:.25},{at:1,title:'Two',question:'Observe',explanation:'',narration:'Two',audioFile:'two.wav',audioDuration:.25}]};
  const config=path.join(dir,'lesson.json'),scene=path.join(dir,'scene.js'),out=path.join(dir,'test.mp4');fs.writeFileSync(config,JSON.stringify(lesson));
  fs.writeFileSync(scene,'function createExperiment(svg){return {check(){return []},render(s){svg.innerHTML=`<circle cx="${100+s.time*100}" cy="250" r="80" fill="orange"/>`}}}');
  const args=[script,'--lesson',config,'--scene',scene,'--out',out,'--width','320','--height','180','--fps','2'];run(process.execPath,args);
  const before=fs.readFileSync(out);assert.notEqual(spawnSync(process.execPath,args).status,0);assert.deepEqual(fs.readFileSync(out),before);
  const pixels=spawnSync('ffmpeg',['-v','error','-i',out,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']).stdout;
  const offset=(90*320+65)*3;assert(pixels[offset]>180 && pixels[offset+1]>70 && pixels[offset+2]<90,'exported frame must contain the orange experiment object');
  const audio=spawnSync('ffmpeg',['-v','error','-i',out,'-vn','-ac','1','-ar','8000','-f','f32le','pipe:1']).stdout;
  const rms=(start,end)=>{let sum=0,n=0;for(let i=Math.floor(start*8000);i<Math.floor(end*8000);i++){sum+=audio.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};
  assert(rms(.03,.2)>.03);assert(rms(.5,.8)<.003);assert(rms(1.03,1.2)>.03);assert(rms(1.5,1.8)<.003);
  delete lesson.stages[1].audioFile;fs.writeFileSync(config,JSON.stringify(lesson));assert.notEqual(spawnSync(process.execPath,[...args,'--force']).status,0);assert.deepEqual(fs.readFileSync(out),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
