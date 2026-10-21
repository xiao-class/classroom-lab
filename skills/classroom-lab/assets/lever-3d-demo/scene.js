function leverModel(leftMass,rightMass,distance) {
 const left=leftMass/1000*9.8*20, right=rightMass/1000*9.8*distance;
 return {left,right,direction:Math.abs(left-right)<1e-8?0:(right>left?1:-1)};
}
function createFlatExperiment(svg) {
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

// Same ideal lever model drives the 3D object, labels and explanation.
function createExperiment(svg) {
 const fallback=createFlatExperiment(svg);let stage,lastState,lost=false;
 const flatRender=state=>{svg.style.display='';svg.parentElement.classList.add('lab-fallback');const wait=state.stageIndex===0?8.5:1.3;const r=fallback.render({...state,localTime:Math.max(0,state.localTime-wait+2)});r.observation='当前使用平面兼容视图。'+r.observation;return r;};
 try{stage=Lab3D.createStage(svg);}catch(e){return {check:fallback.check,render:flatRender};}
 const {T,scene,camera,mesh,material}=stage;
 const teal=material('#1ba79f',.65,.22),gold=material('#d68a39',.65,.24),steel=material('#608087',.78,.24);
 const podium=mesh(new T.CylinderGeometry(4.3,4.45,.16,96),material('#16333b',.55,.25),scene,[0,-1.7,0]);
 const ring=mesh(new T.TorusGeometry(4.28,.023,8,128),new T.MeshBasicMaterial({color:'#74e8d7'}),scene,[0,-1.6,0]);ring.rotation.x=Math.PI/2;
 const support=mesh(new T.ConeGeometry(.58,1.8,3),gold,scene,[0,-.68,0]);support.rotation.y=Math.PI/2;
 const beam=new T.Group();scene.add(beam);beam.position.y=.3;
 mesh(new T.BoxGeometry(8.7,.15,.35),steel,beam);
 for(let n=-4;n<=4;n++)mesh(new T.BoxGeometry(.022,.016,.35),material('#d4efe9',.25,.3),beam,[n,.082,0]);
 const axle=mesh(new T.CylinderGeometry(.19,.19,.6,32),gold,scene,[0,.3,0]);axle.rotation.x=Math.PI/2;
 const weights=[];
 for(const mat of [teal,gold]){const g=new T.Group();scene.add(g);mesh(new T.CylinderGeometry(.018,.018,.68,10),steel,g,[0,-.34,0]);const w=mesh(new T.CylinderGeometry(.36,.36,.48,48),mat,g,[0,-.92,0]);const rim=mesh(new T.TorusGeometry(.365,.018,8,48),new T.MeshBasicMaterial({color:mat===teal?'#8affeb':'#ffdca3'}),g,[0,-.71,0]);rim.rotation.x=Math.PI/2;weights.push({g,w});}
 const leftLabel=stage.label('100 g','#91efde'),rightLabel=stage.label('50 g','#ffd59d');
 const leftDistance=stage.label('20 cm','#91efde'),rightDistance=stage.label('20 cm','#ffd59d');
 const lineMaterial=new T.LineBasicMaterial({color:'#86aaa8',transparent:true,opacity:.7});
 const bracket=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),lineMaterial);scene.add(bracket);
 let textCache='';
 function replaceLabel(old,text,color){scene.remove(old);old.material.map.dispose();old.material.dispose();return stage.label(text,color);}
 let l=leftLabel,r=rightLabel,rd=rightDistance;
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 function render(state){lastState=state;if(lost)return flatRender(state);
  const {params,localTime,time,stageIndex}=state,m=leverModel(params.leftMass,params.rightMass,params.distance);
  // Allow the question's 7.512s narration to finish before giving away the result.
  const wait=stageIndex===0?8.5:1.3;const reveal=smooth((localTime-wait)/1.5);
  const angle=-m.direction*.14*reveal;beam.rotation.z=angle;
  const distance=stageIndex===1&&!state.manualParameters?2+(params.distance/10-2)*smooth(localTime/1.2):params.distance/10;
  // During the visible move, report the very same distance used for geometry.
  const current=leverModel(params.leftMass,params.rightMass,distance*10);
  const point=d=>new T.Vector3(d*Math.cos(angle),.3+d*Math.sin(angle),0);
  weights[0].g.position.copy(point(-2));weights[1].g.position.copy(point(distance));
  weights[0].w.scale.y=params.leftMass/100;weights[0].w.position.y=-.68-.24*params.leftMass/100;
  weights[1].w.scale.y=params.rightMass/100;weights[1].w.position.y=-.68-.24*params.rightMass/100;
  const key=[params.leftMass,params.rightMass,(distance*10).toFixed(1)].join(':');
  if(key!==textCache){l=replaceLabel(l,params.leftMass+' g','#91efde');r=replaceLabel(r,params.rightMass+' g','#ffd59d');rd=replaceLabel(rd,(distance*10).toFixed(0)+' cm','#ffd59d');textCache=key;}
  l.position.copy(weights[0].g.position).add(new T.Vector3(0,-1-.48*params.leftMass/100,0));r.position.copy(weights[1].g.position).add(new T.Vector3(0,-1-.48*params.rightMass/100,0));
  leftDistance.position.set(-1,1.15,0);rd.position.set(distance/2,1.15,0);
  const a=bracket.geometry.attributes.position;a.setXYZ(0,-2,.95,0);a.setXYZ(1,distance,.95,0);a.needsUpdate=true;bracket.geometry.computeBoundingSphere();
  const intro=stage.reducedMotion?1:smooth(time/3.2);camera.position.set(6.8*(1-intro),3.5*(1-intro)+.8,11.8+2.5*intro);camera.lookAt(.6,-.1,0);
  stage.draw();
  const result=current.direction===0?'两侧平衡':current.direction<0?'左侧下降':'右侧下降';
  return {metrics:[{label:'左侧水平参考力矩',value:current.left.toFixed(1)+' N·cm'},{label:'右侧水平参考力矩',value:current.right.toFixed(1)+' N·cm'}],question:'看砝码和距离，猜猜哪边会下降？',explanation:'当前两侧水平参考力矩为 '+current.left.toFixed(1)+' 和 '+current.right.toFixed(1)+' N·cm；'+result+'。',observation:localTime<wait?'先预测，再观察。右侧滑块可改变条件。':result+'。倾斜幅度仅表示转动方向；数值是理想模型计算。'};
 }
 stage.onResize(()=>{if(lastState)render(lastState);});
 stage.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;stage.canvas.hidden=true;if(lastState)render(lastState);});
 return {render,check:fallback.check};
}
