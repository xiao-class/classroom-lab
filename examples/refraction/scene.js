function createExperiment(svg) {
  const deg = Math.PI / 180;
  const refract = i => Math.asin(Math.sin(i * deg) / 1.33) / deg;
  svg.innerHTML = `<defs>
    <marker id="arrowIn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#d16a22"/></marker>
    <marker id="arrowOut" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#087f8c"/></marker>
  </defs>
  <rect width="960" height="250" fill="#fff9ed"/>
  <rect y="250" width="960" height="250" fill="#dbeff2"/>
  <line x1="0" y1="250" x2="960" y2="250" stroke="#67a9b3" stroke-width="3"/>
  <text x="40" y="48" font-size="27" fill="#173b40">空气 · n ≈ 1.00</text>
  <text x="40" y="455" font-size="27" fill="#173b40">水 · n ≈ 1.33</text>
  <text x="806" y="239" font-size="24" fill="#51676b">水面</text>
  <line x1="480" y1="28" x2="480" y2="480" stroke="#647d82" stroke-width="2" stroke-dasharray="9 7"/>
  <text x="501" y="45" font-size="24" fill="#51676b">法线</text>
  <line id="inRay" stroke="#d16a22" stroke-width="5" marker-end="url(#arrowIn)"/>
  <line id="outRay" stroke="#087f8c" stroke-width="5" marker-end="url(#arrowOut)"/>
  <path id="inArc" fill="none" stroke="#b8522a" stroke-width="2"/>
  <path id="outArc" fill="none" stroke="#087f8c" stroke-width="2"/>
  <text id="inLabel" x="650" y="100" font-size="27" fill="#a1451e"/>
  <text id="outLabel" x="650" y="365" font-size="27" fill="#075e68"/>
  <text id="prompt" x="550" y="340" font-size="27" fill="#51676b">水中的光会射向哪里？</text>
  <circle id="pulse" r="7" fill="#ffb439" stroke="#fff" stroke-width="2"/>
  <circle cx="480" cy="250" r="5" fill="#173b40"/>
  <text x="40" y="490" font-size="22" fill="#51676b">角度以法线为基准 · 光路与动画速度为示意</text>`;
  const el = id => svg.querySelector('#'+id);
  const set = (id, attrs) => Object.entries(attrs).forEach(([k,v])=>el(id).setAttribute(k,String(v)));
  return {
    render({time, stageIndex, params}) {
      const i = params.angle, r = refract(i), a = i * deg, b = r * deg;
      const start = {x:480 - 218*Math.sin(a), y:250 - 218*Math.cos(a)};
      const end = {x:480 + 218*Math.sin(b), y:250 + 218*Math.cos(b)};
      const show = stageIndex > 0;
      set('inRay',{x1:start.x,y1:start.y,x2:480,y2:250});
      set('outRay',{x1:480,y1:250,x2:end.x,y2:end.y,visibility:show?'visible':'hidden'});
      set('inArc',{d:i===0?'':`M480 181 A69 69 0 0 0 ${480-69*Math.sin(a)} ${250-69*Math.cos(a)}`});
      set('outArc',{d:i===0?'':`M480 322 A72 72 0 0 0 ${480+72*Math.sin(b)} ${250+72*Math.cos(b)}`,visibility:show?'visible':'hidden'});
      el('inLabel').textContent=`入射角 i = ${i}°`;
      el('outLabel').textContent=`折射角 r = ${r.toFixed(1)}°`;
      set('outLabel',{visibility:show?'visible':'hidden'});
      set('prompt',{visibility:show?'hidden':'visible'});
      const phase = (time % 3) / 3;
      const p = show ? phase*2 : phase;
      const position = p<=1 ? {x:start.x+(480-start.x)*p,y:start.y+(250-start.y)*p} : {x:480+(end.x-480)*(p-1),y:250+(end.y-250)*(p-1)};
      set('pulse',{cx:position.x,cy:position.y});
      return {
        metrics:[{label:'入射角（设置值）',value:i+'°'},{label:'折射角（模型计算）',value:show?r.toFixed(1)+'°':'待观察'},{label:'传播介质',value:'空气 → 水'}],
        observation:!show?'只改变入射角，保持空气、水与界面不变。先预测水中的光路。':i===0?'当前为垂直入射：i = r = 0°，光的方向不变。':`当前斜入射：r = ${r.toFixed(1)}° < i = ${i}°，折射光向法线偏折。`
      };
    },
    check() {
      const assert = (v,msg) => {if(!v)throw Error(msg);};
      assert(refract(0)===0,'垂直入射边界失败');
      assert(Math.abs(refract(30)-22.0824)<0.001,'30度基准失败');
      assert(Math.abs(refract(60)-40.6281)<0.001,'60度基准失败');
      for(let i=1;i<=75;i++) assert(refract(i)>refract(i-1)&&refract(i)<i,'单调性/向法线偏折失败');
      assert(Math.abs(refract(30)-30)>7,'反例检查失败：折射角不等于入射角');
      return ['垂直入射0°','30°→22.1°','60°→40.6°','1–75°单调性与偏折方向','折射角并非总等于入射角'];
    }
  };
}
