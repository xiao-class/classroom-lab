// Developer verification only. npm install --no-save playwright, or supply NODE_PATH.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
 const options={headless:true};
 if(process.env.CHROME_PATH)options.executablePath=process.env.CHROME_PATH;
 const browser=await chromium.launch(options);
 const results=[];
 try{
 for(const name of ['lever','pendulum',...(fs.existsSync(path.join(root,'examples/refraction/index.html'))?['refraction']:[])]){
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
  await page.goto(pathToFileURL(path.join(root,'examples',name,'index.html')).href);
  await page.waitForFunction(()=>window.classroomLab);
  assert.equal(await page.locator('#error').isVisible(),false);
  assert.equal(await page.locator('#explanation').isVisible(),false);
  let state=await page.evaluate(()=>classroomLab.getState());assert.equal(state.playing,false);assert.equal(state.time,0);
  await page.locator('#play').click();await page.waitForTimeout(300);await page.locator('#play').click();
  const frozen=await page.evaluate(()=>classroomLab.getState().time);assert(frozen>0);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>classroomLab.getState().time),frozen);
  await page.locator('#reveal').click();assert(await page.locator('#explanation').isVisible());
  await page.locator('#next').click();assert.equal(await page.evaluate(()=>classroomLab.getState().stageIndex),1);assert.equal(await page.locator('#explanation').isVisible(),false);
  await page.locator('#previous').click();assert.equal(await page.evaluate(()=>classroomLab.getState().stageIndex),0);
  await page.evaluate(()=>classroomLab.seek(5));const shape=await page.locator('#scene').innerHTML();
  await page.evaluate(()=>classroomLab.seek(8));await page.evaluate(()=>classroomLab.seek(5));assert.equal(await page.locator('#scene').innerHTML(),shape);
  await page.locator('#reset').click();assert.equal(await page.evaluate(()=>classroomLab.getState().time),0);
  if(name==='lever'){
   await page.locator('#param-distance').fill('40');await page.locator('#param-distance').dispatchEvent('input');
   await page.evaluate(()=>classroomLab.seek(5));assert.equal(await page.locator('#result').textContent(),'两侧平衡');
   assert.match(await page.locator('#metrics').textContent(),/19\.6 N·cm.*19\.6 N·cm/);
   await page.evaluate(()=>{classroomLab.setParameter('leftMass',50);classroomLab.setParameter('rightMass',100);classroomLab.setParameter('distance',20);classroomLab.seek(5);});
   assert.equal(await page.locator('#result').textContent(),'右侧下降');
   assert.equal(await page.evaluate(()=>Number(document.querySelector('#beam').getAttribute('transform').match(/rotate\(([^ ]+)/)[1])),10);
  }
  if(name==='pendulum'){
   await page.evaluate(()=>classroomLab.seek(14));assert.match(await page.locator('#metrics').textContent(),/1\.42 s.*2\.01 s/);
   const before=await page.evaluate(()=>pendulumPosition(1,1));
   await page.evaluate(()=>{classroomLab.setParameter('mass',200);classroomLab.seek(14);});
   const after=await page.evaluate(()=>pendulumPosition(1,1));assert.deepEqual(after,before);
   assert.match(await page.locator('#right-label').textContent(),/200 g/);
   await page.evaluate(()=>classroomLab.setParameter('length',1.5));
   assert.match(await page.locator('#metrics').textContent(),/2\.46 s/);
  }
  const boundary=await page.evaluate(()=>{try{classroomLab.setParameter('missing',3);return false;}catch{return true;}});assert(boundary);
  await page.evaluate(()=>{const d=JSON.parse(document.querySelector('#lesson-data').textContent).duration;classroomLab.seek(d-.05);classroomLab.play();});
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>classroomLab.getState().playing),false);
  await page.locator('#reset').click();
  await page.locator('summary').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#download-script').click();const download=await downloadPromise;
  const downloadPath=await download.path();assert(fs.readFileSync(downloadPath,'utf8').includes('模型说明'));
  await page.locator('summary').click();
  await page.evaluate(()=>classroomLab.seek(5));
  await page.screenshot({path:path.join(root,'qa',name+'-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#play').scrollIntoViewIfNeeded();assert(await page.locator('#play').isVisible());
  await page.screenshot({path:path.join(root,'qa',name+'-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  results.push({name,passed:true,modelChecks:await page.evaluate(()=>classroomLab.checks),fileProtocol:true,externalRequests:requests,errors,pauseResume:true,deterministicSeek:true,narrationDownload:true,mobileDocumentOverflow:false});
  await context.close();
 }
 fs.writeFileSync(path.join(root,'qa/browser-results.json'),JSON.stringify({testedAt:new Date().toISOString(),browser:await browser.version(),results},null,2));
 console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
