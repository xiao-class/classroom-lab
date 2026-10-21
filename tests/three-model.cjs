// Model/geometry checks with real Three.js math; no browser, canvas or WebGL rendering.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const T=require(process.env.THREE_MODULE||'three');
const source=fs.readFileSync(path.join(__dirname,'../skills/classroom-lab/assets/lever-3d-demo/scene.js'),'utf8');
function svg(){const nodes=new Map();return {style:{},parentElement:{classList:{add(){}}},set innerHTML(x){},querySelector(id){if(!nodes.has(id))nodes.set(id,{setAttribute(){},innerHTML:'',textContent:''});return nodes.get(id)}};}
function setup(available=true){let captured;
 const context=vm.createContext({Math,Lab3D:{createStage(){if(!available)throw Error('WebGL unavailable');const scene=new T.Scene(),camera=new T.PerspectiveCamera();captured={scene,camera};return {T,scene,camera,canvas:{addEventListener(){}},reducedMotion:false,draw(){},onResize(){},material:(color,m,r)=>new T.MeshStandardMaterial({color,metalness:m,roughness:r}),mesh(g,m,parent=scene,position=[0,0,0]){const o=new T.Mesh(g,m);o.position.set(...position);parent.add(o);return o;},label(){const o=new T.Sprite(new T.SpriteMaterial());o.material.map={dispose(){}};scene.add(o);return o;}}}}});
 vm.runInContext(source,context);const api=context.createExperiment(svg());return {api,get stage(){return captured}};}
const x=setup(),api=x.api;assert.equal(api.check().length,3);let cases=0;
for(const leftMass of [50,100,150,200])for(const rightMass of [50,100,150,200])for(const distance of [10,20,30,40]){
 const state={params:{leftMass,rightMass,distance},time:34,localTime:10,stageIndex:2};const out=api.render(state);
 assert.equal(out.metrics[0].value,(leftMass*.196).toFixed(1)+' N·cm');assert.equal(out.metrics[1].value,(rightMass*distance*.0098).toFixed(1)+' N·cm');
 const groups=x.stage.scene.children.filter(o=>o.isGroup);const [beam,left,right]=groups;
 const expected=Math.sign(rightMass*distance-leftMass*20);
 assert.equal(Math.sign(right.position.y-left.position.y),expected===0?0:-expected);
 assert(Math.abs(right.position.x-distance/10*Math.cos(beam.rotation.z))<1e-10);
 const before=groups.map(g=>[...g.position.toArray(),g.rotation.z]);api.render({...state,time:1,localTime:1});api.render(state);assert.deepEqual(groups.map(g=>[...g.position.toArray(),g.rotation.z]),before);cases++;
}
const state={params:{leftMass:100,rightMass:50,distance:20},time:7.5,localTime:7.5,stageIndex:0};api.render(state);assert.equal(x.stage.scene.children.find(o=>o.isGroup).rotation.z,0);
api.render({...state,time:10,localTime:10});assert(x.stage.scene.children.find(o=>o.isGroup).rotation.z>0);
const camera=x.stage.camera.position.toArray();api.render({...state,time:20,localTime:8,stageIndex:1});assert.deepEqual(x.stage.camera.position.toArray(),camera);
const mid=api.render({params:{leftMass:100,rightMass:50,distance:40},time:12.6,localTime:.6,stageIndex:1});assert.equal(mid.metrics[1].value,'14.7 N·cm');
const manual=api.render({params:{leftMass:100,rightMass:50,distance:40},time:12,localTime:0,stageIndex:1,manualParameters:true});assert.equal(manual.metrics[1].value,'19.6 N·cm');
const flat=setup(false);const fallback=flat.api.render(state);assert(fallback.observation.includes('平面兼容'));assert.equal(fallback.metrics[0].value,'19.6 N·cm');
console.log(JSON.stringify({passed:true,parameterCombinations:cases,checks:['independent torque values','correct tilt direction','geometry and current interpolated value agree','seek determinism','prediction hold','camera settles','non-WebGL fallback API'],boundary:'No WebGL drawing, browser interactions, visual or audio review'}));
