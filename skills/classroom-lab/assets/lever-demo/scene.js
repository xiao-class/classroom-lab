function leverModel(leftMass,rightMass,distance) {
 const left=leftMass/1000*9.8*20, right=rightMass/1000*9.8*distance;
 return {left,right,direction:Math.abs(left-right)<1e-8?0:(right>left?1:-1)};
}
function createExperiment(svg) {
 svg.innerHTML=`<defs><pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#dce7e2" stroke-width="1"/></pattern></defs>
 <rect x="55" y="55" width="850" height="370" rx="20" fill="url(#grid)"/>
 <path d="M480 225L438 362H522Z" fill="#d9e9e3" stroke="#173b40" stroke-width="3"/><path d="M414 365H546" stroke="#173b40" stroke-width="6" stroke-linecap="round"/>
 <text x="480" y="410" text-anchor="middle" fill="#51676b" font-size="24">支点</text>
 <g id="beam"><rect x="165" y="211" width="630" height="18" rx="9" fill="#173b40"/><g id="ticks"></g></g>
 <g id="left"><line x1="0" y1="0" x2="0" y2="75" stroke="#087f8c" stroke-width="4"/><rect x="-45" y="75" width="90" height="65" rx="10" fill="#087f8c"/><text id="left-label" x="0" y="116" text-anchor="middle" fill="white" font-size="25" font-weight="700"/></g>
 <g id="right"><line x1="0" y1="0" x2="0" y2="75" stroke="#b8522a" stroke-width="4"/><rect x="-45" y="75" width="90" height="65" rx="10" fill="#b8522a"/><text id="right-label" x="0" y="116" text-anchor="middle" fill="white" font-size="25" font-weight="700"/></g>
 <circle cx="480" cy="220" r="9" fill="#fff" stroke="#173b40" stroke-width="4"/>
 <path d="M340 120V105H480V120" fill="none" stroke="#087f8c" stroke-width="2"/><text x="410" y="90" text-anchor="middle" fill="#087f8c" font-size="26">20 cm</text>
 <path id="right-bracket" fill="none" stroke="#b8522a" stroke-width="2"/><text id="distance-label" y="90" text-anchor="middle" fill="#b8522a" font-size="26"/>
 <text id="result" x="480" y="470" text-anchor="middle" fill="#173b40" font-size="27" font-weight="650"/>`;
 const get=id=>svg.querySelector('#'+id);
 get('ticks').innerHTML=Array.from({length:9},(_,i)=>`<line x1="${200+i*70}" y1="212" x2="${200+i*70}" y2="228" stroke="#f5f3eb" stroke-width="2"/>`).join('');
 return {
  render({localTime,params}) {
   const m=leverModel(params.leftMass,params.rightMass,params.distance);
   const p=Math.max(0,Math.min(1,(localTime-2)/2)), eased=(1-Math.cos(p*Math.PI))/2;
   const angle=m.direction*10*eased, r=angle*Math.PI/180;
   const pos=d=>({x:480+d*7*Math.cos(r),y:220+d*7*Math.sin(r)});
   get('beam').setAttribute('transform',`rotate(${angle} 480 220)`);
   for(const [id,d,mass] of [['left',-20,params.leftMass],['right',params.distance,params.rightMass]]){
    const a=pos(d);get(id).setAttribute('transform',`translate(${a.x} ${a.y})`);get(id+'-label').textContent=mass+' g';
   }
   const rightX=480+params.distance*7;
   get('right-bracket').setAttribute('d',`M480 120V105H${rightX}V120`);
   get('distance-label').setAttribute('x',(480+rightX)/2);get('distance-label').textContent=params.distance+' cm';
   const result=m.direction===0?'两侧平衡':m.direction<0?'左侧下降':'右侧下降';
   get('result').textContent=localTime<2?'先预测，再观察':result;
   return {question:'观察当前砝码和距离，你预测哪边会下降？',explanation:'当前两侧水平参考力矩分别为'+m.left.toFixed(1)+'和'+m.right.toFixed(1)+' N·cm；'+(m.direction===0?'两侧相等，因此平衡。':(m.direction<0?'左侧':'右侧')+'更大，因此向这一侧转动。'),metrics:[{label:'左侧水平参考力矩',value:m.left.toFixed(1)+' N·cm'},{label:'右侧水平参考力矩',value:m.right.toFixed(1)+' N·cm'}],observation:'距离沿杆测量；倾斜仅为方向示意。调整后点播放，观察结果。'};
  },
  check(){
   const a=leverModel(100,50,40),b=leverModel(100,50,20),c=leverModel(50,100,20);
   if(a.direction!==0||Math.abs(a.left-19.6)>1e-8)throw Error('100g×20cm与50g×40cm基准错误');
   if(b.direction!==-1||c.direction!==1)throw Error('左右转动方向错误');
   if(leverModel(200,50,40).direction!==-1)throw Error('范围内无平衡情况错误');
   return ['19.6 N·cm平衡基准','左右反向对照','超出可调范围的无解情形'];
  }
 };
}
