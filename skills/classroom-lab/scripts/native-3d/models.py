"""Deterministic teaching states, shared by geometry, labels and QA. SI except stated units."""
import math,re
from life_models import dissolution,mitosis

def smooth(t,a,b):
    u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)

def lerp(a,b,k):return a+(b-a)*k

def stage_at(lesson,t):
    return max(i for i,s in enumerate(lesson['stages']) if s['at']<=t)

def params_at(lesson,i):
    p={q['key']:q['value'] for q in lesson['parameters']}
    for s in lesson['stages'][:i+1]:p.update(s.get('values',{}))
    return p

def subtitle(stage,u):
    phrases=[s for s in re.split(r'(?<=[。？！？，；])',stage['narration']) if s]
    duration=stage['audioDuration']
    if u>=duration:return ''
    weight=sum(map(len,phrases));bound=0
    for p in phrases:
        bound+=duration*len(p)/weight
        if u<bound:return p
    return ''

def state(lesson,t):
    i=stage_at(lesson,t);s=lesson['stages'][i];u=t-s['at'];p=params_at(lesson,i);prev=params_at(lesson,max(0,i-1))
    d={'time':t,'stage':i,'stageTitle':s['title'],'subtitle':subtitle(s,u),'progress':t/lesson['duration']}
    kind=lesson['sceneType']
    if kind=='lever':
        distance=p['distance'] if i==0 else lerp(prev['distance'],p['distance'],smooth(u,1.5 if i==1 else 4,3.5 if i==1 else 6))
        left=p['leftMass']/1000*9.8*.20;right=p['rightMass']/1000*9.8*distance/100
        reveal=smooth(u,s['audioDuration']+1,s['audioDuration']+2.5) if i==0 else 1
        angle=.22*(left-right)/max(left,right)*reveal
        d.update(leftMass=p['leftMass'],rightMass=p['rightMass'],distance=distance,leftTorque=left,rightTorque=right,angle=angle,
            reveal=reveal,leftValue=f"{p['leftMass']:g} g × 20 cm",rightValue=f"{p['rightMass']:g} g × {distance:.0f} cm",
            leftDetail='先预测，暂不揭示结果' if reveal==0 else f'水平参考力矩 {left*100:.1f} N·cm',
            rightDetail='哪一侧会下降？' if reveal==0 else f'水平参考力矩 {right*100:.1f} N·cm',
            note='理想轻杆 · 倾斜幅度与速度为示意 · 力矩随倾角同乘 cos θ')
        d['conclusion']='先猜，再观察' if reveal==0 else ('两侧力矩相等，杠杆平衡' if abs(left-right)<1e-7 else ('左侧力矩较大，左端下降' if left>right else '右侧力矩较大，右端下降'))
    elif kind=='pendulum':
        length=p['length'] if i!=1 else lerp(prev['length'],p['length'],smooth(u,.4,1.4))
        elapsed=max(0,u-(3.5 if i==0 else 2))
        tl=2*math.pi*math.sqrt(.5/9.8);tr=2*math.pi*math.sqrt(length/9.8)
        al=math.radians(8)*math.cos(elapsed*math.sqrt(9.8/.5));ar=math.radians(8)*math.cos(elapsed*math.sqrt(9.8/length))
        d.update(length=length,mass=p['mass'],leftAngle=al,rightAngle=ar,leftPeriod=tl,rightPeriod=tr,elapsed=elapsed,
            leftValue='0.50 m · 50 g',rightValue=f'{length:.2f} m · {p["mass"]:g} g',
            leftDetail=f'周期 T = {tl:.2f} s',rightDetail=f'周期 T = {tr:.2f} s',
            note='理想小角度模型 · 初始摆角 8° · g = 9.8 m/s² · 无阻尼')
        d['conclusion']='相同摆长，同时往返' if i==0 else ('摆长加倍，周期为原来的 √2 倍' if i==1 else '同一摆长，质量改变，周期不变')
    elif kind=='refraction':
        angle=p['angle'] if i<2 else lerp(prev['angle'],p['angle'],smooth(u,.6,2.6))
        a=math.radians(angle);b=math.asin(math.sin(a)/1.33)
        reveal=0 if i==0 else (smooth(u,0,1.4) if i==1 else 1)
        d.update(incident=a,refracted=b,reveal=reveal,leftValue=f'入射角 i = {angle:.1f}°',rightValue='折射角 r = ?' if i==0 else f'折射角 r = {math.degrees(b):.1f}°',
            leftDetail='空气  n₁ = 1.00',rightDetail='水  n₂ = 1.33',
            note='平直界面 · 单色光 · 省略部分反射 · 光点仅示意传播方向')
        d['conclusion']='进入水中后，光会往哪边走？' if i==0 else ('垂直入射：方向不变，传播速度变小' if angle<.001 else '斜入射：折射光向法线偏折')
    elif kind in ('dissolution','mitosis'):
        beats=[0,12,26,40,52] if kind=='dissolution' else [0,14,28,42,56]
        end=lesson['stages'][i+1]['at'] if i+1<len(lesson['stages']) else lesson['duration']
        teaching_time=beats[i]+u/(end-s['at'])*(beats[i+1]-beats[i])
        d.update((dissolution if kind=='dissolution' else mitosis)(teaching_time,i,teaching_time-beats[i]))
    else:raise ValueError('Unknown 3D sceneType; implement the requested science, do not relabel an existing scene')
    return d
