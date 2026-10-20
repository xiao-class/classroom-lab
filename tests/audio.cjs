const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{const options={headless:true};if(process.env.CHROME_PATH)options.executablePath=process.env.CHROME_PATH;const b=await chromium.launch(options);const results=[];
try{for(const name of ['lever','pendulum','refraction']){
 const p=await b.newPage();await p.route(/^https?:/,r=>r.abort());await p.goto(pathToFileURL(path.join(root,'examples',name,'index.html')).href);
 await p.waitForFunction(()=>document.querySelector('#narration-audio').readyState>=2);
 await p.evaluate(()=>{const a=document.querySelector('#narration-audio');window.ac=new AudioContext();window.an=ac.createAnalyser();ac.createMediaElementSource(a).connect(an);an.connect(ac.destination);});
 await p.locator('#play').click();await p.evaluate(()=>ac.resume());await p.waitForTimeout(700);
 const playing=await p.evaluate(()=>{const a=document.querySelector('#narration-audio'),wave=new Float32Array(an.fftSize);an.getFloatTimeDomainData(wave);return {time:a.currentTime,paused:a.paused,energy:wave.reduce((n,x)=>n+x*x,0)/wave.length,visual:classroomLab.getState().time}});
 assert(playing.time>.3&&!playing.paused);assert(playing.energy>1e-8);assert(Math.abs(playing.time-playing.visual)<.4);
 await p.locator('#play').click();const frozen=await p.evaluate(()=>document.querySelector('#narration-audio').currentTime);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>document.querySelector('#narration-audio').currentTime),frozen);
 await p.locator('#next').click();await p.locator('#play').click();await p.waitForTimeout(250);assert(await p.evaluate(()=>document.querySelector('#narration-audio').currentTime<1&&!document.querySelector('#narration-audio').paused));
 await p.locator('#voice-toggle').click();assert(await p.evaluate(()=>document.querySelector('#narration-audio').paused));await p.locator('#voice-toggle').click();await p.waitForTimeout(100);assert(!(await p.evaluate(()=>document.querySelector('#narration-audio').paused)));
 await p.locator('#reset').click();assert(await p.evaluate(()=>document.querySelector('#narration-audio').currentTime===0&&document.querySelector('#narration-audio').paused));
 const input=p.locator('#parameters input').first();const max=await input.getAttribute('max');await input.fill(max);await input.dispatchEvent('input');await p.locator('#play').click();await p.waitForTimeout(100);assert(await p.evaluate(()=>document.querySelector('#narration-audio').paused));assert.match(await p.locator('#voice-status').textContent(),/改变实验条件/);
 await p.locator('#reset').click();await p.evaluate(()=>classroomLab.seek(2));await p.locator('#play').click();await p.waitForTimeout(100);const sought=await p.evaluate(()=>document.querySelector('#narration-audio').currentTime);assert(sought>=2&&sought<2.5);
 results.push({name,passed:true,signal:playing,pause:true,stageChange:true,mute:true,reset:true,customParameterStopsStaleNarration:true,seek:true});await p.close();
}fs.writeFileSync(path.join(root,'qa/audio-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
