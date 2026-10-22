import json,math,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'skills/classroom-lab/scripts/native-3d'))
from models import state

def lesson(k):return json.loads((ROOT/f'skills/classroom-lab/assets/physics-3d/{k}/lesson.json').read_text())
class NativePhysics(unittest.TestCase):
 def test_prediction_waits_for_voice_and_thinking(self):
  d=lesson('lever')
  for t in [0,3,7.5,8.5]:
   s=state(d,t);self.assertEqual(s['angle'],0);self.assertEqual(s['reveal'],0)
  self.assertGreater(state(d,11)['angle'],0)
 def test_lever_geometry_and_numbers_during_transition(self):
  d=lesson('lever')
  for t in [12,13.7,14.5,15.1,16,24,28.4,29.7,32]:
   s=state(d,t);self.assertAlmostEqual(s['rightTorque'],s['rightMass']/1000*9.8*s['distance']/100)
   self.assertEqual(s['angle']>0,s['leftTorque']>s['rightTorque'])
  self.assertAlmostEqual(state(d,16)['leftTorque'],.196)
  self.assertAlmostEqual(state(d,16)['rightTorque'],.196)
  self.assertAlmostEqual(state(d,32)['leftTorque'],.098)
  self.assertAlmostEqual(state(d,32)['rightTorque'],.098)
 def test_pendulum_period_and_mass_invariance(self):
  d=lesson('pendulum');a=state(d,16);b=state(d,28)
  self.assertAlmostEqual(a['rightPeriod']/a['leftPeriod'],math.sqrt(2))
  self.assertEqual(a['rightPeriod'],b['rightPeriod']);self.assertEqual(a['rightAngle'],b['rightAngle'])
  self.assertEqual(b['mass'],200)
  # Independent temporal check: the same bob returns after its computed period.
  c=state(d,16+a['rightPeriod']);self.assertAlmostEqual(c['rightAngle'],a['rightAngle'])
 def test_snell_and_zero(self):
  d=lesson('refraction')
  self.assertEqual(state(d,11.99)['reveal'],0)
  self.assertAlmostEqual(math.degrees(state(d,20)['refracted']),22.082413194472252,places=6)
  for t in [12,18,24,25,26,30,36,37,38,40,48]:
   s=state(d,t);self.assertAlmostEqual(math.sin(s['incident']),1.33*math.sin(s['refracted']))
  s=state(d,40);self.assertEqual(s['incident'],0);self.assertEqual(s['refracted'],0)
 def test_seek_independent_of_call_order(self):
  for k in ['lever','pendulum','refraction']:
   d=lesson(k);a=state(d,15.25);state(d,30);state(d,1);self.assertEqual(a,state(d,15.25))
 def test_no_snaps_between_frames(self):
  # Smoothness: nothing the camera sees may jump between consecutive 30 fps frames, stage boundaries included.
  for k,key,limit in [('lever','angle',.02),('lever','leftMass',8),('refraction','incident',.03),('refraction','refracted',.03)]:
   d=lesson(k);prev=state(d,0)[key]
   for f in range(1,int(d['duration']*30)):
    cur=state(d,f/30)[key];self.assertLess(abs(cur-prev),limit,f'{k}.{key} jumps at {f/30:.2f}s');prev=cur
 def test_lever_labels_name_real_weights(self):
  d=lesson('lever')
  for f in range(0,int(d['duration']*30)):
   s=state(d,f/30);self.assertIn(s['leftMassShown'],(50,100,150,200));self.assertIn(s['rightMassShown'],(50,100,150,200))
   self.assertNotRegex(s['leftValue'],r'^(?!50 |100 |150 |200 )')
 def test_subtitles_end_with_actual_audio(self):
  d=lesson('refraction');self.assertNotEqual(state(d,25)['subtitle'],'');self.assertEqual(state(d,35.5)['subtitle'],'')

class ExportPreservation(unittest.TestCase):
 def test_missing_audio_keeps_existing_output(self):
  import tempfile,subprocess,platform
  if platform.system()!='Darwin':self.skipTest('native backend is macOS-specific')
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp);d=lesson('lever');(p/'lesson.json').write_text(json.dumps(d));target=p/'animation.mp4';target.write_bytes(b'existing-approved-video')
   result=subprocess.run([sys.executable,str(ROOT/'skills/classroom-lab/scripts/export_3d.py'),'--lesson',str(p/'lesson.json'),'--out',str(target),'--force'],capture_output=True)
   self.assertNotEqual(result.returncode,0);self.assertEqual(target.read_bytes(),b'existing-approved-video')
 def test_existing_output_requires_explicit_revision(self):
  import tempfile,subprocess,platform
  if platform.system()!='Darwin':self.skipTest('native backend is macOS-specific')
  with tempfile.TemporaryDirectory() as tmp:
   target=Path(tmp)/'animation.mp4';target.write_bytes(b'old')
   result=subprocess.run([sys.executable,str(ROOT/'skills/classroom-lab/scripts/export_3d.py'),'--lesson',str(ROOT/'skills/classroom-lab/assets/physics-3d/lever/lesson.json'),'--out',str(target)],capture_output=True)
   self.assertNotEqual(result.returncode,0);self.assertEqual(target.read_bytes(),b'old');self.assertIn(b'Output exists',result.stderr)

if __name__=='__main__':unittest.main()
