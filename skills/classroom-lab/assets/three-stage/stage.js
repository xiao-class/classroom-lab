import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export {T};
// No textures, fonts or modules are fetched by the generated page.
export function createStage(svg) {
 const canvas=document.createElement('canvas');canvas.className='lab-three';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',svg.getAttribute('aria-label')||'三维实验');
 svg.before(canvas);
 let renderer;
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});}catch(e){canvas.remove();throw e;}
 svg.style.display="none";
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor('#07171e');
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene();scene.fog=new T.FogExp2('#07171e',.036);
 const camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(7,4,11);camera.lookAt(0,.3,0);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.38;
 const key=new T.DirectionalLight('#ecffff',3.1);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.0005;scene.add(key);
 scene.add(new T.HemisphereLight('#aadce3','#0c1722',1.2));
 for(const [color,x,z] of [['#3ce5d3',-5,-3],['#ffb35e',5,1]]){const l=new T.PointLight(color,35,22);l.position.set(x,3,z);scene.add(l);}
 const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:'#10252c',roughness:.38,metalness:.4}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.85;floor.receiveShadow=true;scene.add(floor);
 const grid=new T.GridHelper(40,50,'#234047','#193139');grid.position.y=-1.84;scene.add(grid);
 let redraw=()=>{};function resize(){const r=canvas.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();redraw();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 return {T,scene,camera,canvas,renderer,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
  material:(color,metalness=.6,roughness=.28)=>new T.MeshStandardMaterial({color,metalness,roughness}),
  mesh(geometry,material,parent=scene,position=[0,0,0]){const m=new T.Mesh(geometry,material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;},
  label(text,color='#effbf4'){const c=document.createElement('canvas');c.width=640;c.height=144;const x=c.getContext('2d');x.fillStyle=color;x.font='600 64px system-ui, "PingFang SC", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,320,72);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const mat=new T.SpriteMaterial({map:tx,depthTest:false});const s=new T.Sprite(mat);s.scale.set(2.2,.495,1);scene.add(s);return s;},
  draw(){renderer.render(scene,camera);},onResize(fn){redraw=fn;},
  dispose(){observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){m.map?.dispose();m.dispose();}});environment.dispose();room.dispose();pmrem.dispose();renderer.dispose();canvas.remove();svg.style.display="";}
 };
}
