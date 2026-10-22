"""Identity-preserving teaching trajectories; not molecular dynamics or live microscopy."""
import math

def smooth(t,a,b):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
def mix(a,b,k):return [x+(y-x)*k for x,y in zip(a,b)]
def water(center,direction,charge,radius):
 # O is nearer a cation; the H bisector points toward an anion.
 n=direction;axis=[1.,0,0] if abs(n[0])<.8 else [0,1.,0]
 tangent=[n[1]*axis[2]-n[2]*axis[1],n[2]*axis[0]-n[0]*axis[2],n[0]*axis[1]-n[1]*axis[0]]
 length=math.sqrt(sum(x*x for x in tangent));tangent=[x/length for x in tangent]
 o=[center[j]+n[j]*radius for j in range(3)]
 # Sign of the bisector, not oxygen's relative position, determines polarity.
 h=[]
 for sign in [-1,1]:h.append([o[j]+charge*n[j]*.20+sign*tangent[j]*.26 for j in range(3)])
 return {'oxygen':o,'hydrogens':h}

def dissolution(t,stage,u):
 spread=smooth(t,12.5,23.5);detail=smooth(t,26,27.2)*(1-smooth(t,39.0,40.0))
 ions=[];waters=[]
 for index in range(20):
  x=index%5;y=(index//5)%2;z=index//10;charge=1 if (x+y+z)%2==0 else -1
  start=[(x-2)*.98,(y-.5)*.98+.35,(z-.5)*.98]
  end=[(index%5-2)*1.65,1.7-(index//5)*1.05,(-.35 if index%2 else .35)]
  # Same IDs in every frame; tiny deterministic thermal drift is only illustrative.
  p=mix(start,end,spread)
  p=[v+spread*.065*math.sin(t*.8+index*1.7+j) for j,v in enumerate(p)]
  ions.append({'id':index,'charge':charge,'position':p})
  # Sample solvent near ions while dispersing; hydration is not delayed until the detail shot.
  n=[0,0,1];w=water(p,n,charge,.57);w['opacity']=smooth(t,11.8,14);waters.append(w)
 close=[]
 for charge,cx in [(1,-2.25),(-1,2.25)]:
  center=[cx,.35,0];ws=[]
  for j in range(6):
   a=2*math.pi*j/6+.2;z=.25*(-1 if j%2 else 1);norm=math.sqrt(1+z*z);n=[math.cos(a)/norm,math.sin(a)/norm,z/norm]
   ws.append(water(center,n,charge,1.25))
  close.append({'charge':charge,'position':center,'waters':ws})
 return dict(ions=ions,waters=waters,detailIons=close,detail=detail,spread=spread,
  positiveCount=sum(x['charge']==1 for x in ions),negativeCount=sum(x['charge']==-1 for x in ions),netCharge=sum(x['charge'] for x in ions),
  leftValue='Na⁺  10 个  ·  Cl⁻  10 个',leftDetail='追踪同一组离子 · 总电荷始终为 0',
  rightValue='氧端 → Na⁺  /  氢端 → Cl⁻' if stage==2 else '晶格 → 水中分散',rightDetail='水合局部放大 · 两个代表离子不另计数' if stage==2 else '青色 Na⁺ / 金色 Cl⁻ · 颜色仅为辨识',
  conclusion=['先记住离子：它们会消失吗？','离子种类不变，水分子伴随包围','O δ− 朝向正离子；H δ+ 朝向负离子','数量不变，电荷守恒：10 − 10 = 0'][stage],
  note='三维微观示意 · 仅追踪 20 个离子 · 尺寸/轨迹/时间非实测 · 不模拟饱和度')

def mitosis(t,stage,u):
 align=smooth(t,14,17);sep=smooth(t,28,35);division=smooth(t,45,51);decondense=smooth(t,43,49)
 split=t>=28;cells=2 if division>=1 else 1
 traces=[]
 for index in range(4):
  y=1.45-index*.85;z=(-.18 if index%2 else .18);length=.31 if index%2==0 else .23
  x=(1-align)*[-.8,.65,-.55,.8][index]
  for side in [-1,1]:
   center=[x+side*(.075+2.425*sep),y,z]
   points=[]
   for j in range(13):
    v=j/6-1
    arm=side*(1-2*sep)*.30*abs(v)
    coil=.22*math.sin((v+1)*math.pi*2.0+index*.7)
    points.append([center[0]+arm*(1-decondense)+coil*decondense,center[1]+v*length,center[2]+.09*math.sin(v*math.pi)*decondense])
   traces.append({'id':f'{index}:{side}','pair':index,'side':side,'centromere':center,'points':points,
      'chromosomeId':f'{index}:{side}' if split else str(index)})
 return dict(traces=traces,align=align,separation=sep,division=division,decondense=decondense,
  nucleusOriginal=1-smooth(t,9,13),nucleiNew=smooth(t,42,44),fibers=smooth(t,9,13)*(1-smooth(t,42,45)),
  cells=cells,chromosomesPerCell=4 if cells==2 else 8 if split else 4,dnaPerCell=4 if cells==2 else 8,totalDNA=8,
  leftValue='2 个子细胞 · 各 4 条染色体' if cells==2 else ('1 个细胞 · 8 条染色体' if split else '1 个细胞 · 4 条染色体'),
  leftDetail='按着丝粒计数 · 动物细胞 2n = 4 简化模型',
  rightValue='每个子细胞：4 个核 DNA' if cells==2 else '当前细胞：8 个核 DNA',rightDetail='DNA 已在分裂前复制 · 追踪 8 条 DNA 线迹',
  conclusion=['每条复制后的染色体含两条姐妹染色单体','中期：4 条复制后的染色体排列在中央','后期：姐妹分开，各自成为一条染色体','核膜重建，胞质缢裂形成两个子细胞'][stage],
  note='三维剖开示意 · 前期/前中期合并 · 仅统计核 DNA · 省略部分结构，大小与时间非实测')
