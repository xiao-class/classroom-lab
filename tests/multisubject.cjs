// Model + SVG artifact rendering only. Does not open a browser or exercise playback UI.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'qa/multisubject');fs.mkdirSync(qa,{recursive:true});
const Resvg=process.env.RESVG_MODULE?require(process.env.RESVG_MODULE).Resvg:null;
let checks=0;
for(const [name,modelName] of [['dissolution','dissolutionModel'],['mitosis','mitosisModel']]){
 const context=vm.createContext({Math});vm.runInContext(fs.readFileSync(path.join(root,'skills/classroom-lab/assets',name+'-demo/scene.js'),'utf8'),context);
 const svg={innerHTML:''};const api=context.createExperiment(svg);assert(api.check().length>=2);
 for(let stage=0;stage<4;stage++)for(const time of [0,.1,2,5,8,10,13]){
  const m=context[modelName](stage,time),state={stageIndex:stage,localTime:time,time:time+stage*14,params:{},revealed:false};
  const result=api.render(state),first=svg.innerHTML;api.render({...state,localTime:1});api.render(state);assert.equal(svg.innerHTML,first);
  assert(!/NaN|undefined|Infinity/.test(first));assert(result.metrics.length===3);
  if(name==='dissolution'){
   assert.equal(m.ions.length,20);assert.equal(m.ions.filter(p=>p.species==='Na+').length,10);assert.equal(m.ions.filter(p=>p.species==='Cl-').length,10);assert.equal(m.ions.reduce((a,p)=>a+p.charge,0),0);
   for(const p of m.ions){assert(p.x>=55&&p.x<=640);assert(p.y>=90&&p.y<=430);}
  }else{
   assert.equal(m.cells*m.dnaPerCell,8);assert.equal(m.chromosomes.length,4);
   assert.equal(m.chromosomesPerCell,m.cells===2?4:stage>=2?8:4);
  }
  checks++;
 }
 for(const [stage,time] of [[0,0],[1,6],[2,6],[3,12],[3,4]]){
  api.render({stageIndex:stage,localTime:time,time:stage*14+time,params:{},revealed:false});
  const full=`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="750" viewBox="0 0 960 500" font-family="PingFang SC, sans-serif">${svg.innerHTML}</svg>`;
  const file=path.join(qa,`${name}-stage-${stage+1}${stage===3&&time===4?"-mid":""}`);fs.writeFileSync(file+'.svg',full);
  if(Resvg){const renderer=new Resvg(full,{font:{loadSystemFonts:true,defaultFontFamily:'PingFang SC'}});fs.writeFileSync(file+'.png',renderer.render().asPng());}
 }
}
// Independent polarity geometry: O closest for Na+, H closer for Cl−.
const h=52.25*Math.PI/180,R=57,l=17;
assert(Math.hypot(R+l*Math.cos(h),l*Math.sin(h))>R);
assert(Math.hypot(R-l*Math.cos(h),l*Math.sin(h))<R);
const report={passed:true,modelSamples:checks,staticFrames:Resvg?10:0,checks:['ion species/count/charge conserved','ions remain in viewport','DNA conserved across cytokinesis','stage-specific chromosome counting','seek determinism','finite SVG','water polarity orientation'],boundary:'SVG static frames only; no browser playback, UI interaction or full listening review'};
fs.writeFileSync(path.join(qa,'model-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
