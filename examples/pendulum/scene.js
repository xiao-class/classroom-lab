function pendulumPeriod(length){return 2*Math.PI*Math.sqrt(length/9.8);}
function pendulumPosition(length,time){const theta=8*Math.PI/180*Math.cos(2*Math.PI*time/pendulumPeriod(length));return {x:Math.sin(theta)*length*200,y:Math.cos(theta)*length*200};}
function createExperiment(svg){
 svg.innerHTML=`<defs><pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#d3dfd9"/></pattern></defs><rect x="55" y="40" width="850" height="410" rx="20" fill="url(#dots)"/>
 <line x1="120" y1="80" x2="840" y2="80" stroke="#173b40" stroke-width="9" stroke-linecap="round"/>
 <g id="left-pendulum"><line id="left-string" stroke="#087f8c" stroke-width="4"/><circle id="left-ball" r="22" fill="#087f8c"/></g>
 <g id="right-pendulum"><line id="right-string" stroke="#b8522a" stroke-width="4"/><circle id="right-ball" r="22" fill="#b8522a"/></g>
 <path d="M280 90V420M680 90V420" stroke="#b7c9c1" stroke-width="2" stroke-dasharray="6 8"/>
 <circle cx="280" cy="80" r="7" fill="#173b40"/><circle cx="680" cy="80" r="7" fill="#173b40"/>
 <text x="280" y="40" text-anchor="middle" fill="#087f8c" font-size="25">左侧 · 0.5 m / 50 g</text>
 <text id="right-label" x="680" y="40" text-anchor="middle" fill="#b8522a" font-size="25"/>
 <text x="280" y="480" text-anchor="middle" fill="#087f8c" font-size="24">保持不变</text><text x="680" y="480" text-anchor="middle" fill="#b8522a" font-size="24">改变一个条件</text>`;
 const get=id=>svg.querySelector('#'+id);
 return {
 render({localTime,params,stageIndex}){
  for(const [side,length,origin] of [['left',.5,280],['right',params.length,680]]){
   const p=pendulumPosition(length,localTime),line=get(side+'-string'),ball=get(side+'-ball');
   line.setAttribute('x1',origin);line.setAttribute('y1',80);line.setAttribute('x2',origin+p.x);line.setAttribute('y2',80+p.y);
   ball.setAttribute('cx',origin+p.x);ball.setAttribute('cy',80+p.y);
  }
  get('right-label').textContent='右侧 · '+params.length.toFixed(1)+' m / '+params.mass+' g';
  return {question:stageIndex===2?'保持当前摆长，改变右侧质量，周期会变吗？':'比较当前两只摆，哪只完成一次往返更慢？',explanation:stageIndex===2?'理想小角度模型中，周期与摆球质量无关；改变质量后周期保持不变。':'当前右侧摆长是左侧的'+(params.length/.5).toFixed(1)+'倍，周期是左侧的'+Math.sqrt(params.length/.5).toFixed(2)+'倍。',metrics:[{label:'左侧周期（模型计算）',value:pendulumPeriod(.5).toFixed(2)+' s'},{label:'右侧周期（模型计算）',value:pendulumPeriod(params.length).toFixed(2)+' s'}],observation:'一次完整往返是一个周期；两侧均从8°释放。摆球图形大小不表示质量或密度。'};
 },
 check(){
  if(Math.abs(pendulumPeriod(1)-2.007089923)>1e-8)throw Error('1米摆周期基准错误');
  if(Math.abs(pendulumPeriod(1)/pendulumPeriod(.25)-2)>1e-10)throw Error('摆长四倍对应周期两倍');
  const a=pendulumPosition(1,0),b=pendulumPosition(1,pendulumPeriod(1));
  if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)throw Error('一周期后未回到原位置');
  if(Math.abs(Math.hypot(a.x,a.y)-200)>1e-8)throw Error('摆长绘制比例错误');
  return ['1米摆周期2.00709秒','摆长四倍周期两倍','周期闭合及摆长几何'];
 }
 };
}
