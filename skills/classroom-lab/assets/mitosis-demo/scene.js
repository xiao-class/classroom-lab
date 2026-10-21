const bioClamp=x=>Math.max(0,Math.min(1,x));
const bioEase=x=>{x=bioClamp(x);return x*x*(3-2*x);};
function mitosisModel(stageIndex,localTime){
 const split=stageIndex>=2;
 const separation=stageIndex<2?0:stageIndex===2?bioEase(localTime/8):1;
 const division=stageIndex<3?0:bioEase(localTime/9);
 const align=stageIndex===0?bioEase(Math.max(0,localTime-7)/5):1;
 const chromosomes=Array.from({length:4},(_,i)=>({id:i,color:i<2?'#a9f0c1':'#d4acff',y:139+i*74,length:i%2===0?32:23,x:480+(1-align)*((i%2===0?-1:1)*96)}));
 return {split,separation,division,align,chromosomes,cells:division>=1?2:1,chromosomesPerCell:division>=1?4:split?8:4,dnaPerCell:division>=1?4:8,totalDNA:8};
}
function mitosisSVG(state){
 const {stageIndex,localTime}=state,m=mitosisModel(stageIndex,localTime);
 const cell=(cx,rx,opacity=1)=>`<ellipse cx="${cx}" cy="250" rx="${rx}" ry="185" fill="url(#cell)" stroke="#76bcb2" stroke-width="3" opacity="${opacity}"/><ellipse cx="${cx}" cy="250" rx="${rx-8}" ry="177" fill="none" stroke="#8ce4bd" stroke-opacity=".16" stroke-width="2"/>`;
 let membrane;
 if(stageIndex<3)membrane=cell(480,340+25*m.separation);
 else if(m.division>=1)membrane=cell(287,175)+cell(673,175);
 else{const q=m.division,neck=185*(1-q)+4*q;membrane=`<path d="M480 ${250-neck} C${340-70*q} 12 107 25 115 250 C107 475 ${340-70*q} 488 480 ${250+neck} C${620+70*q} 488 853 475 845 250 C853 25 ${620+70*q} 12 480 ${250-neck}Z" fill="url(#cell)" stroke="#76bcb2" stroke-width="3"/>`;}
 const poles=[170,790];let fibers='',chrom='';
 for(const c of m.chromosomes){
  const sep=175*m.separation;
  const h=c.length;
  const strand=(x,dir)=>`<path d="M${x+dir*15} ${c.y-h} Q${x} ${c.y-5} ${x} ${c.y} Q${x} ${c.y+5} ${x+dir*15} ${c.y+h}" fill="none" stroke="${c.color}" stroke-width="10" stroke-linecap="round"/><circle cx="${x}" cy="${c.y}" r="5" fill="#f2ffdf"/>`;
  const x1=c.x-(m.split?sep:4),x2=c.x+(m.split?sep:4);
  const fiberOpacity=stageIndex===3?1-m.division:stageIndex===0?m.align:.75;
  fibers+=`<path d="M${poles[0]} 250Q300 ${c.y-32} ${x1} ${c.y} M${poles[1]} 250Q660 ${c.y-32} ${x2} ${c.y}" fill="none" stroke="#8fdccd" stroke-width="1.7" opacity="${fiberOpacity}"/>`;
  if(stageIndex===3){
   // Morph each DNA trace into chromatin without drawing a second copy.
   for(const [x,dir] of [[x1,1],[x2,-1]]){
    const points=Array.from({length:25},(_,j)=>{const u=j/12-1,from=x+dir*15*Math.abs(u),to=x+Math.sin((u+1)*Math.PI*2.1)*16-dir*6;return [(1-m.division)*from+m.division*to,c.y+u*h];});
    chrom+=`<path d="${points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}" fill="none" stroke="${c.color}" stroke-width="${10-7*m.division}" stroke-linecap="round"/>`;
   }
  }else chrom+=strand(x1,1)+strand(x2,-1);
 }
 const nuclei=stageIndex===3?`<ellipse cx="305" cy="250" rx="106" ry="165" fill="#7397d4" fill-opacity="${m.division*.08}" stroke="#a1b5df" stroke-width="2" stroke-opacity="${m.division}"/><ellipse cx="655" cy="250" rx="106" ry="165" fill="#7397d4" fill-opacity="${m.division*.08}" stroke="#a1b5df" stroke-width="2" stroke-opacity="${m.division}"/>`:stageIndex===0?`<ellipse cx="480" cy="250" rx="240" ry="170" fill="none" stroke="#a1b5df" stroke-width="2" stroke-dasharray="9 8" opacity="${1-m.align}"/>`:'';
 const halos=poles.map(x=>`<circle cx="${x}" cy="250" r="24" fill="#b7f8d0" opacity=".05"/><circle cx="${x}" cy="250" r="8" fill="#b7f8d0"/>`).join('');
 return `<defs><radialGradient id="bio-bg"><stop stop-color="#183d3f"/><stop offset="1" stop-color="#091b25"/></radialGradient><radialGradient id="cell" cx="40%" cy="28%"><stop stop-color="#2c6460" stop-opacity=".7"/><stop offset=".78" stop-color="#15403f" stop-opacity=".7"/><stop offset="1" stop-color="#4c8b77" stop-opacity=".5"/></radialGradient></defs><rect width="960" height="500" fill="url(#bio-bg)"/>
 <text x="32" y="38" fill="#a9d9c5" font-size="22" letter-spacing="2">生物 / 有丝分裂</text><text x="928" y="38" fill="#9ebdbd" font-size="20" text-anchor="end">动物细胞 · 2n＝4 示意</text>
 ${membrane}${nuclei}${fibers}${stageIndex===3?'':halos}${chrom}
 ${stageIndex===1?'<path d="M480 87V414" stroke="#d5d3a1" stroke-dasharray="6 7" opacity=".5"/><text x="500" y="100" fill="#e5e4b2" font-size="22">赤道板</text>':''}
 <text x="480" y="476" text-anchor="middle" font-size="23" fill="#d2e9df">${['分裂前已完成 DNA 复制：先认清姐妹染色单体。','四条复制后的染色体排列在细胞中央。','姐妹染色单体分离，分别移向两极。','核膜重建，胞质分裂形成两个子细胞。'][stageIndex]}</text>`;
}
function createExperiment(svg){return {
 render(state){svg.innerHTML=mitosisSVG(state).replace(/font-size="(\d+)"/g, 'font-size="$1" style="font-size:$1px"');const m=mitosisModel(state.stageIndex,state.localTime);return {metrics:[{label:'细胞数（示意）',value:m.cells},{label:m.cells===2?'每个子细胞染色体':'当前细胞染色体',value:m.chromosomesPerCell+' 条'},{label:m.cells===2?'每个子细胞核 DNA':'当前细胞核 DNA',value:m.dnaPerCell+' 个'}],observation:'从已完成 DNA 复制开始；颜色用于追踪，非真实染色。后期分开后，每条原染色单体计为一条染色体。',explanation:m.cells===2?'两个子细胞各有4条染色体、4个核DNA分子；不把DNA复制放在分裂后期。':m.split?'后期在同一细胞内暂有8条染色体，核DNA总数仍为8；每极各4条。':'目前有4条复制后的染色体，每条含两条姐妹染色单体；核DNA分子共8个。'};},
 check(){if(mitosisModel(1,0).chromosomesPerCell!==4||mitosisModel(2,2).chromosomesPerCell!==8)throw Error('染色体计数错误');const end=mitosisModel(3,12);if(end.cells*end.dnaPerCell!==8||end.chromosomesPerCell!==4)throw Error('子细胞遗传物质分配错误');return ['分裂前4条染色体/8个核DNA','后期同一细胞8条染色体/8个核DNA','子细胞各4条染色体/4个核DNA'];}
};}
