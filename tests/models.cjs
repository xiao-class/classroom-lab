const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({Math});
vm.runInContext(fs.readFileSync(path.join(root,'skills/classroom-lab/assets/lever-demo/scene.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'examples/pendulum/scene.js'),'utf8'),ctx);
let cases=0;
for(const l of [50,100,150,200])for(const r of [50,100,150,200])for(const d of [10,20,30,40]){
 const model=ctx.leverModel(l,r,d);
 assert.equal(model.direction,Math.sign(r*d-l*20));
 assert(Math.abs(model.left-l*0.196)<1e-8);
 assert(Math.abs(model.right-r*d*0.0098)<1e-8);cases++;
}
assert(Math.abs(ctx.pendulumPeriod(.5)-1.419226895)<1e-8);
for(let i=5;i<=15;i++){
 const L=i/10,T=ctx.pendulumPeriod(L);
 if(i>5)assert(T>ctx.pendulumPeriod((i-1)/10));
 for(const fraction of [0,.25,.5,.75,1]){
  const p=ctx.pendulumPosition(L,T*fraction);
  assert(Math.abs(Math.hypot(p.x,p.y)-L*200)<1e-8);
  if(fraction===.25||fraction===.75)assert(Math.abs(p.x)<1e-8);
  cases++;
 }
}
console.log(JSON.stringify({modelCases:cases,passed:true,scope:'64 lever states; 55 pendulum geometry/phase samples; independent numerical baselines'}));
