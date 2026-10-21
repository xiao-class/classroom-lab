const chemClamp=x=>Math.max(0,Math.min(1,x));
const chemEase=x=>{x=chemClamp(x);return x*x*(3-2*x);};
function dissolutionModel(stageIndex,localTime){
 const spread=stageIndex===0?0:stageIndex===1?chemEase(localTime/10):1;
 const hydration=stageIndex<2?0:stageIndex===2?chemEase(localTime/3):1;
 const ions=Array.from({length:20},(_,i)=>{const row=Math.floor(i/5),col=i%5,positive=(row+col)%2===0;
  const start={x:252+col*40,y:180+row*40},end={x:95+col*112+(row%2)*23+13*Math.sin(i*2.3),y:130+row*85+10*Math.cos(i*1.9)};
  const wobble=stageIndex>0?spread*7:0;
  return {id:i,species:positive?'Na+':'Cl-',charge:positive?1:-1,x:start.x+(end.x-start.x)*spread+wobble*Math.sin(localTime*.7+i),y:start.y+(end.y-start.y)*spread+wobble*Math.cos(localTime*.6+i*1.7)};
 });
 return {ions,spread,hydration,sodium:10,chloride:10,totalCharge:0};
}
function chemWater(x,y,angle,scale=1,opacity=1){
 const h=52.25*Math.PI/180,dx=17*Math.cos(h),dy=17*Math.sin(h);
 return `<g transform="translate(${x} ${y}) rotate(${angle*180/Math.PI}) scale(${scale})" opacity="${opacity}"><path d="M0 0L${dx} ${dy}M0 0L${dx} ${-dy}" stroke="#b5e5f0" stroke-width="4"/><circle r="8" fill="url(#oxygen)"/><circle cx="${dx}" cy="${dy}" r="5" fill="#e7f5ff"/><circle cx="${dx}" cy="${-dy}" r="5" fill="#e7f5ff"/></g>`;
}
function chemistrySVG(state){
 const {stageIndex,localTime}=state,m=dissolutionModel(stageIndex,localTime);
 const water=Array.from({length:24},(_,i)=>chemWater(70+(i%6)*100,105+Math.floor(i/6)*99,.3*Math.sin(localTime*.4+i)+i,1,.16)).join('');
 const bonds=stageIndex<2?m.ions.flatMap((a,i)=>m.ions.slice(i+1).filter(b=>Math.hypot(b.x-a.x,b.y-a.y)<43).map(b=>`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="#89afc8" stroke-width="2" opacity="${.4*(1-m.spread)}"/>`)).join(''):'';
 const particles=m.ions.map(a=>`<g transform="translate(${a.x} ${a.y})"><circle r="${a.charge>0?23:29}" fill="${a.charge>0?'#ffcf66':'#7c9eff'}" opacity=".06"/><circle r="${a.charge>0?17:23}" fill="url(#${a.charge>0?'sodium':'chloride'})"/><circle cx="-5" cy="-7" r="4" fill="white" opacity=".48"/><text text-anchor="middle" y="6" fill="${a.charge>0?'#392511':'#112544'}" font-size="19" font-weight="800">${a.charge>0?'+':'−'}</text></g>`).join('');
 const shell=(cx,cy,positive)=>{const waters=Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5-.3;return chemWater(cx+57*Math.cos(a),cy+57*Math.sin(a),a+(positive?0:Math.PI),.8,m.hydration);}).join('');return `<circle cx="${cx}" cy="${cy}" r="${positive?20:26}" fill="url(#${positive?'sodium':'chloride'})"/><text x="${cx}" y="${cy+7}" fill="#142c40" text-anchor="middle" font-size="22" font-weight="700">${positive?'+':'−'}</text>${waters}`;};
 return `<defs><radialGradient id="bg"><stop stop-color="#173751"/><stop offset="1" stop-color="#07131e"/></radialGradient><radialGradient id="sodium" cx="30%" cy="25%"><stop stop-color="#fff6b6"/><stop offset=".5" stop-color="#ffc366"/><stop offset="1" stop-color="#ad5f2a"/></radialGradient><radialGradient id="chloride" cx="25%" cy="25%"><stop stop-color="#d9edff"/><stop offset=".5" stop-color="#7fafff"/><stop offset="1" stop-color="#405eae"/></radialGradient><radialGradient id="oxygen"><stop stop-color="#ff9b9b"/><stop offset="1" stop-color="#db506b"/></radialGradient></defs>
 <rect width="960" height="500" fill="url(#bg)"/><circle cx="330" cy="270" r="205" fill="none" stroke="#294860"/><circle cx="330" cy="270" r="211" fill="none" stroke="#1d3346"/>
 <text x="32" y="43" fill="#9cc8e4" font-size="22" letter-spacing="2">化学 / 微观过程</text><text x="630" y="43" text-anchor="end" fill="#a0bfce" font-size="20">颜色与轨迹为示意</text>
 ${water}${bonds}${particles}
 <rect x="682" y="76" width="250" height="364" rx="22" fill="#112535" stroke="#35536a"/>
 <text x="807" y="110" text-anchor="middle" fill="#d9e9f3" font-size="23">水合 · 局部放大</text>
 ${shell(807,194,true)}${shell(807,344,false)}
 <text x="807" y="276" text-anchor="middle" fill="#ffce81" font-size="20">Na⁺：氧端朝向离子</text><text x="807" y="425" text-anchor="middle" fill="#a9c8ff" font-size="20">Cl⁻：氢端朝向离子</text>
 <text x="807" y="476" text-anchor="middle" fill="#9db5c8" font-size="17">水分子：红色 O / 白色 H</text><text x="32" y="476" fill="#c4dbe7" font-size="22">${stageIndex===0?'晶体里的离子，会怎样进入水中？':stageIndex===1?'晶格松开，离子在水中分散。':'Na⁺ 和 Cl⁻ 仍在水中，没有消失。'}</text>`;
}
function createExperiment(svg){return {
 render(state){svg.innerHTML=chemistrySVG(state).replace(/font-size="(\d+)"/g, 'font-size="$1" style="font-size:$1px"');const m=dissolutionModel(state.stageIndex,state.localTime);return {metrics:[{label:'追踪的 Na⁺',value:m.sodium+' 个'},{label:'追踪的 Cl⁻',value:m.chloride+' 个'},{label:'总电荷（相对 e）',value:'0'}],observation:'球体颜色、粒子数量、尺度与速度为示意；右侧是同类离子的放大解释，不计入左侧追踪数量。',explanation:'氯化钠晶体由钠离子和氯离子构成。溶解时离子分散并被水分子包围，种类与总电荷保持不变。'};},
 check(){for(const s of [0,1,2,3])for(const t of [0,5,13]){const m=dissolutionModel(s,t);if(m.ions.filter(x=>x.charge===1).length!==10||m.ions.reduce((a,x)=>a+x.charge,0)!==0)throw Error('离子数量或电荷不守恒');}return ['10个钠离子与10个氯离子全程守恒','总电荷为零','溶解不生成新离子种类'];}
};}
