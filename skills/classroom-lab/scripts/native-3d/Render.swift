// macOS native offscreen SceneKit/Metal renderer. No browser, webview or capture.
import AppKit
import SceneKit
import Metal
import simd

func color(_ hex:UInt32,_ alpha:CGFloat=1)->NSColor {NSColor(srgbRed:CGFloat((hex>>16)&255)/255,green:CGFloat((hex>>8)&255)/255,blue:CGFloat(hex&255)/255,alpha:alpha)}
let teal:UInt32=0x52ead7, gold:UInt32=0xffc078, white:UInt32=0xe8f6f7
func vec(_ x:Double,_ y:Double,_ z:Double)->SCNVector3 {SCNVector3(x,y,z)}
func number(_ d:[String:Any],_ k:String)->Double {(d[k] as? NSNumber)?.doubleValue ?? 0}
func sm(_ t:Double,_ a:Double,_ b:Double)->Double{let u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)}
func material(_ c:UInt32,_ metal:CGFloat=0,_ rough:CGFloat=0.35,_ glow:Bool=false)->SCNMaterial {
 let m=SCNMaterial();m.lightingModel = .physicallyBased;m.diffuse.contents=color(c);m.metalness.contents=metal;m.roughness.contents=rough
 if glow {m.emission.contents=color(c);m.emission.intensity=1.4};return m
}
func mesh(_ g:SCNGeometry,_ m:SCNMaterial,_ parent:SCNNode,_ p:SCNVector3=SCNVector3Zero)->SCNNode {
 let n=SCNNode(geometry:g);g.materials=[m];n.position=p;parent.addChildNode(n);return n
}
func box(_ x:CGFloat,_ y:CGFloat,_ z:CGFloat,_ r:CGFloat=0.04)->SCNBox {SCNBox(width:x,height:y,length:z,chamferRadius:r)}
func cylinder(_ r:CGFloat,_ h:CGFloat)->SCNCylinder {let g=SCNCylinder(radius:r,height:h);g.radialSegmentCount=48;return g}
func rod(_ a:SCNVector3,_ b:SCNVector3,_ r:CGFloat,_ m:SCNMaterial,_ parent:SCNNode)->SCNNode {
 let delta=SIMD3<Float>(Float(b.x-a.x),Float(b.y-a.y),Float(b.z-a.z));let len=simd_length(delta)
 let n=mesh(cylinder(r,CGFloat(max(len,0.0001))),m,parent,vec(Double(a.x+b.x)/2,Double(a.y+b.y)/2,Double(a.z+b.z)/2))
 if len>0.0001{n.simdOrientation=simd_quatf(from:SIMD3<Float>(0,1,0),to:delta/len)};return n
}
func segment(_ n:SCNNode,_ a:SCNVector3,_ b:SCNVector3) {
 let d=SIMD3<Float>(Float(b.x-a.x),Float(b.y-a.y),Float(b.z-a.z));let len=simd_length(d)
 n.position=vec(Double(a.x+b.x)/2,Double(a.y+b.y)/2,Double(a.z+b.z)/2);n.scale=SCNVector3(1,max(len,0.0001),1)
 if len>0.0001{n.simdOrientation=simd_quatf(from:SIMD3<Float>(0,1,0),to:d/len)}
}
func environment()->NSImage {
 let im=NSImage(size:NSSize(width:1024,height:512));im.lockFocus();color(0x34434c).setFill();NSRect(x:0,y:0,width:1024,height:512).fill()
 for (x,w,c) in [(80,100,UInt32(0xacf0ee)),(360,150,UInt32(0xffffff)),(790,60,UInt32(0xffb26f))]{color(c).setFill();NSBezierPath(roundedRect:NSRect(x:x,y:120,width:w,height:300),xRadius:45,yRadius:45).fill()}
 im.unlockFocus();return im
}
final class Lab {
 let scene=SCNScene(),camera=SCNNode(),renderer:SCNRenderer,kind:String
 var beam=SCNNode(),leftWeight=SCNNode(),rightWeight=SCNNode(),leftBob=SCNNode(),rightBob=SCNNode(),leftString=SCNNode(),rightString=SCNNode(),rayIn=SCNNode(),rayOut=SCNNode(),pulse=SCNNode(),arcs=SCNNode()
 let silver=material(0x98bac5,0.83,0.21),blue=material(0x159f9d,0.66,0.22),amber=material(0xdba15e,0.72,0.24),dark=material(0x102c38,0.65,0.26),glow=material(teal,0,0.3,true),warm=material(gold,0,0.3,true)
 init(_ kind:String){
  self.kind=kind;renderer=SCNRenderer(device:MTLCreateSystemDefaultDevice(),options:nil);renderer.scene=scene
  scene.background.contents=color(0x07121c);scene.lightingEnvironment.contents=environment();scene.lightingEnvironment.intensity=1.0
  scene.fogColor=color(0x07121c);scene.fogStartDistance=24;scene.fogEndDistance=48
  camera.camera=SCNCamera();camera.camera!.fieldOfView=39;camera.camera!.zNear=0.1;camera.camera!.zFar=100;camera.camera!.wantsHDR=true;camera.camera!.wantsExposureAdaptation=false;camera.camera!.exposureOffset = -0.35
  camera.camera!.bloomIntensity=0.18;camera.camera!.bloomThreshold=1;camera.camera!.bloomBlurRadius=8
  scene.rootNode.addChildNode(camera);renderer.pointOfView=camera
  func light(_ type:SCNLight.LightType,_ c:UInt32,_ intensity:CGFloat,_ p:SCNVector3,_ shadow:Bool=false){let n=SCNNode();n.light=SCNLight();n.light!.type=type;n.light!.color=color(c);n.light!.intensity=intensity;n.position=p;n.look(at:vec(0,-0.4,0));n.light!.castsShadow=shadow;n.light!.shadowMode = .deferred;n.light!.shadowColor=NSColor.black.withAlphaComponent(0.6);n.light!.shadowRadius=5;n.light!.shadowSampleCount=16;scene.rootNode.addChildNode(n)}
  light(.directional,0xe5f9ff,1400,vec(-4,8,7),true);light(.omni,teal,350,vec(-5,3,-2));light(.omni,gold,450,vec(5,4,1));light(.ambient,0x809dad,180,vec(0,0,0))
  let floor=SCNFloor();floor.reflectivity=0.12;floor.reflectionFalloffEnd=4;_ = mesh(floor,material(0x0b1720,0.35,0.3),scene.rootNode,vec(0,-2.6,0))
  let g=SCNNode();scene.rootNode.addChildNode(g)
  for i in -12...12 {let f=Double(i);_ = rod(vec(f,-2.59,-12),vec(f,-2.59,12),0.003,material(0x26424a),g);_ = rod(vec(-12,-2.59,f),vec(12,-2.59,f),0.003,material(0x26424a),g)}
  if kind=="lever"{buildLever()}else if kind=="pendulum"{buildPendulum()}else{buildOptics()}
 }
 func podium(_ radius:CGFloat,_ y:Double){_ = mesh(cylinder(radius,0.18),dark,scene.rootNode,vec(0,y,0));_ = mesh(SCNTorus(ringRadius:radius-0.03,pipeRadius:0.015),glow,scene.rootNode,vec(0,y+0.095,0))}
 func buildLever(){
  podium(4.8,-2.42)
  let support=SCNPyramid(width:1.1,height:2.45,length:1);_ = mesh(support,amber,scene.rootNode,vec(0,-2.31,0))
  _ = rod(vec(0,0.18,-0.5),vec(0,0.18,0.5),0.19,amber,scene.rootNode)
  scene.rootNode.addChildNode(beam);beam.position=vec(0,0.18,0);_ = mesh(box(9,0.18,0.48),silver,beam)
  for i in -8...8{_ = mesh(box(0.018,0.016,i%2==0 ? 0.48:0.25,0),glow,beam,vec(Double(i)*0.5,0.1,0))}
  for (n,m) in [(leftWeight,blue),(rightWeight,amber)]{scene.rootNode.addChildNode(n);_ = rod(vec(0,0,0),vec(0,-0.7,0),0.018,silver,n);_ = mesh(SCNTorus(ringRadius:0.15,pipeRadius:0.025),silver,n,vec(0,-0.64,0));_ = mesh(cylinder(0.38,0.55),m,n,vec(0,-1.0,0));_ = mesh(SCNTorus(ringRadius:0.385,pipeRadius:0.022),m===blue ? glow:warm,n,vec(0,-0.74,0))}
 }
 func buildPendulum(){
  podium(5,-2.43)
  _ = rod(vec(-4,-2.31,-0.65),vec(-4,2.6,-0.65),0.1,silver,scene.rootNode);_ = rod(vec(4,-2.31,-0.65),vec(4,2.6,-0.65),0.1,silver,scene.rootNode)
  _ = mesh(box(8.3,0.18,0.32),silver,scene.rootNode,vec(0,2.6,-0.65))
  for x in [-2.0,2.0]{_ = rod(vec(x,2.6,-0.65),vec(x,2.6,0),0.085,amber,scene.rootNode);_ = mesh(SCNSphere(radius:0.13),amber,scene.rootNode,vec(x,2.6,0))}
  leftString=mesh(cylinder(0.014,1),silver,scene.rootNode);rightString=mesh(cylinder(0.014,1),silver,scene.rootNode)
  leftBob=mesh(SCNSphere(radius:0.28),blue,scene.rootNode);rightBob=mesh(SCNSphere(radius:0.28),amber,scene.rootNode)
 }
 func buildOptics(){
  podium(4.9,-2.43)
  let water=material(0x217f9b,0.1,0.16);water.transparency = 0.12;water.blendMode = .alpha;water.transparencyMode = .aOne;water.isDoubleSided=true;water.writesToDepthBuffer=false
  _ = mesh(box(7.2,2.2,2.2,0.025),water,scene.rootNode,vec(0,-1.1,-0.3))
  let rim=material(0x85cedb,0.6,0.24)
  for y in [0.0,-2.2]{for z in [-1.4,0.8]{_ = rod(vec(-3.6,y,z),vec(3.6,y,z),0.012,rim,scene.rootNode)};for x in [-3.6,3.6]{_ = rod(vec(x,y,-1.4),vec(x,y,0.8),0.012,rim,scene.rootNode)}}
  for x in [-3.6,3.6]{for z in [-1.4,0.8]{_ = rod(vec(x,0,z),vec(x,-2.2,z),0.012,rim,scene.rootNode)}}
  for n in -7...9{let y=Double(n)*0.31;_ = rod(vec(0,y,0),vec(0,y+0.15,0),0.012,material(0x94b5c0,0,0.3,true),scene.rootNode)}
  rayIn=mesh(cylinder(0.028,1),warm,scene.rootNode);rayOut=mesh(cylinder(0.033,1),warm,scene.rootNode);rayOut.renderingOrder=100;rayOut.geometry!.firstMaterial!.readsFromDepthBuffer=false
  pulse=mesh(SCNSphere(radius:0.06),material(0xffffff,0,0.2,true),scene.rootNode)
  scene.rootNode.addChildNode(arcs)
  _ = mesh(SCNTorus(ringRadius:0.14,pipeRadius:0.015),warm,scene.rootNode,vec(0,0,0))
 }
 func update(_ d:[String:Any]){
  let t=number(d,"time"), intro=sm(t,0,3.2)
  let end:SCNVector3=kind=="refraction" ? vec(0,0.3,16.1) : (kind=="pendulum" ? vec(1.0,2.0,17.8):vec(1.3,2.6,17.2))
  camera.position=vec(7*(1-intro)+Double(end.x)*intro,4.5*(1-intro)+Double(end.y)*intro,12*(1-intro)+Double(end.z)*intro)
  camera.look(at:kind=="refraction" ? vec(0,-0.5,0):vec(0,-0.8,0),up:vec(0,1,0),localFront:vec(0,0,-1))
  if kind=="lever"{
   let a=number(d,"angle"),right=number(d,"distance")/10;beam.eulerAngles.z=CGFloat(a)
   leftWeight.position=vec(-2*cos(a),0.18-2*sin(a),0);rightWeight.position=vec(right*cos(a),0.18+right*sin(a),0)
   for (n,key) in [(leftWeight,"leftMass"),(rightWeight,"rightMass")]{let k=number(d,key)/100;n.childNodes[2].scale=vec(1,k,1);n.childNodes[2].position.y=CGFloat(-0.73-0.275*k)}
  }else if kind=="pendulum"{
   let ll=2.0,rr=number(d,"length")*4,al=number(d,"leftAngle"),ar=number(d,"rightAngle")
   let l=vec(-2+ll*sin(al),2.6-ll*cos(al),0),r=vec(2+rr*sin(ar),2.6-rr*cos(ar),0)
   leftBob.position=l;rightBob.position=r;segment(leftString,vec(-2,2.6,0),l);segment(rightString,vec(2,2.6,0),r)
   // Same visible radius: changing mass does not redefine the length to the centre.
  }else{
   let a=number(d,"incident"),b=number(d,"refracted"),rev=number(d,"reveal")
   let start=vec(-3.5*sin(a),3.5*cos(a),0),end=vec(2.18*tan(b)*rev,-2.18*rev,0)
   segment(rayIn,start,vec(0,0,0));segment(rayOut,vec(0,0,0),end);rayOut.isHidden=rev==0
   let q=(t*0.36).truncatingRemainder(dividingBy:1)
   pulse.position=q<0.6 ? vec(Double(start.x)*(1-q/0.6),Double(start.y)*(1-q/0.6),0):vec(Double(end.x)*(q-0.6)/0.4,Double(end.y)*(q-0.6)/0.4,0);pulse.isHidden=rev==0 && q>=0.6
   arcs.childNodes.forEach{$0.removeFromParentNode()}
   for (angle,sign,mat) in [(a,1.0,warm),(b,-1.0,warm)]{
    if sign<0 && rev==0{continue};let r=0.72,steps=24
    for j in 0..<steps {let q0=angle*Double(j)/Double(steps),q1=angle*Double(j+1)/Double(steps);_ = rod(vec(-sign*r*sin(q0),sign*r*cos(q0),0.04),vec(-sign*r*sin(q1),sign*r*cos(q1),0.04),0.008,mat,arcs)}
   }
  }
 }
 func project(_ p:SCNVector3)->NSPoint{let q=renderer.projectPoint(p);return NSPoint(x:CGFloat(q.x),y:1080-CGFloat(q.y))}
}
func text(_ s:String,_ x:CGFloat,_ y:CGFloat,_ size:CGFloat,_ c:UInt32=white,_ bold:Bool=false,_ width:CGFloat=1700,_ align:NSTextAlignment = .left){
 let style=NSMutableParagraphStyle();style.alignment=align;style.lineBreakMode = .byWordWrapping
 let font=NSFont(name:bold ? "PingFangSC-Semibold":"PingFangSC-Regular",size:size) ?? NSFont.systemFont(ofSize:size,weight:bold ? .semibold:.regular)
 (s as NSString).draw(in:NSRect(x:x,y:y,width:width,height:size*2.7),withAttributes:[.font:font,.foregroundColor:color(c),.paragraphStyle:style])
}
func rounded(_ rect:NSRect,_ fill:UInt32,_ alpha:CGFloat=1){color(fill,alpha).setFill();NSBezierPath(roundedRect:rect,xRadius:16,yRadius:16).fill()}
func overlay(_ im:NSImage,_ lab:Lab,_ d:[String:Any],_ title:String)->NSBitmapImageRep {
 let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:1920,pixelsHigh:1080,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:1920*4,bitsPerPixel:32)!
 let ctx=NSGraphicsContext(bitmapImageRep:rep)!.cgContext;ctx.translateBy(x:0,y:1080);ctx.scaleBy(x:1,y:-1)
 NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=NSGraphicsContext(cgContext:ctx,flipped:true)
 im.draw(in:NSRect(x:0,y:0,width:1920,height:1080),from:NSRect.zero,operation:.copy,fraction:1,respectFlipped:true,hints:nil)
 // Solid typography outside the 3D scene; no controls are recorded.
 text("CLASSROOM LAB   /   PHYSICS IN MOTION",64,33,18,teal,true)
 text(title,64,68,52,white,true)
 text(String(format:"%02d",Int(number(d,"stage"))+1)+" / "+(d["stageTitle"] as! String),1400,60,25,gold,true,450,.right)
 text("三维教学模型",1500,102,21,0x8aa6b4,false,350,.right)
 let vals=[("leftValue","leftDetail",teal,CGFloat(64)),("rightValue","rightDetail",gold,CGFloat(1020))]
 for (key,detail,c,x) in vals{rounded(NSRect(x:x,y:748,width:836,height:122),0x0b1a25,0.92);text(d[key] as! String,x+26,760,34,c,true,780);text(d[detail] as! String,x+26,810,24,0xb2c7d0,false,780)}
 text(d["conclusion"] as! String,180,892,30,white,true,1560,.center)
 rounded(NSRect(x:180,y:946,width:1560,height:66),0x07111a,0.95)
 text(d["subtitle"] as! String,205,958,32,white,false,1510,.center)
 text(d["note"] as! String,64,1030,19,0x819ca9,false,1700)
 color(teal).setFill();NSRect(x:64,y:1066,width:1792*number(d,"progress"),height:3).fill()
 func tag(_ label:String,_ p:SCNVector3,_ c:UInt32,_ dx:CGFloat=0,_ dy:CGFloat=0){let q=lab.project(p);text(label,q.x-145+dx,q.y+dy,26,c,true,290,.center)}
 if lab.kind=="lever"{
  tag(String(format:"%0.0f g",number(d,"leftMass")),lab.leftWeight.position,teal,-25,145);tag(String(format:"%0.0f g",number(d,"rightMass")),lab.rightWeight.position,gold,25,145)
  tag("20 cm",vec(-1,0.72,0.2),teal,0,-38);tag(String(format:"%0.0f cm",number(d,"distance")),vec(number(d,"distance")/20,0.72,0.2),gold,0,-38)
 }else if lab.kind=="pendulum"{
  tag("0.50 m",vec(-2.65,1.6,0),teal,-30);tag(String(format:"%0.2f m",number(d,"length")),vec(2.65,2.6-number(d,"length")*2,0),gold,40)
 }else{
  tag("空气",vec(3,1.6,0),gold);tag("水",vec(-2.8,-1.1,0.1),teal);tag("法线",vec(0.7,2.5,0),0xaec4cf)
 }
 NSGraphicsContext.restoreGraphicsState();return rep
}
let args=CommandLine.arguments
if args.count<2{fputs("Usage: renderer frames.json [snapshot-directory]\n",stderr);exit(2)}
let data=try Data(contentsOf:URL(fileURLWithPath:args[1]));let config=try JSONSerialization.jsonObject(with:data) as! [String:Any]
let kind=config["sceneType"] as! String;guard ["lever","pendulum","refraction"].contains(kind) else{fatalError("Unknown scene")}
let lab=Lab(kind);guard lab.renderer.device != nil else{fatalError("Metal device unavailable; no 2D fallback")}
let frames=config["frames"] as! [[String:Any]];let title=config["title"] as! String
for (index,d) in frames.enumerated(){autoreleasepool{
 SCNTransaction.begin();SCNTransaction.animationDuration=0;SCNTransaction.disableActions=true;lab.update(d);SCNTransaction.commit()
 let im=lab.renderer.snapshot(atTime:number(d,"time"),with:CGSize(width:1920,height:1080),antialiasingMode:.multisampling4X)
 let bitmap=overlay(im,lab,d,title)
 if args.count>2 {try! bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:args[2]+String(format:"/frame-%05d.png",index)))}else{FileHandle.standardOutput.write(Data(bytes:bitmap.bitmapData!,count:1920*1080*4))}
 if index%150==0 {fputs("3D frame \(index)/\(frames.count)\n",stderr)}
}}
