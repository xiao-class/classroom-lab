import json,sys,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'skills/classroom-lab/scripts/native-3d'))
from models import state

def lesson(k):return json.loads((ROOT/f'skills/classroom-lab/assets/life-3d/{k}/lesson.json').read_text())
class LifeModels(unittest.TestCase):
 def test_ions_keep_identity_species_and_charge(self):
  d=lesson('dissolution');initial=state(d,0)['ions']
  identity=[(x['id'],x['charge']) for x in initial]
  for t in [0,8,11.9,12,16,23,26,32,39.5,40,51.9]:
   s=state(d,t);self.assertEqual([(x['id'],x['charge']) for x in s['ions']],identity)
   self.assertEqual((s['positiveCount'],s['negativeCount'],s['netCharge']),(10,10,0))
   self.assertEqual(len({tuple(x['position']) for x in s['ions']}),20)
  self.assertEqual(state(d,11.9)['spread'],0)
  self.assertNotEqual(state(d,24)['ions'][0]['position'],initial[0]['position'])
 def test_crystal_alternates_charges_in_three_axes(self):
  ions=state(lesson('dissolution'),0)['ions']
  for i,a in enumerate(ions):
   for b in ions[i+1:]:
    dist=math.dist(a['position'],b['position'])
    if abs(dist-.98)<1e-6:self.assertEqual(a['charge'],-b['charge'])
 def test_hydration_orientation_and_water_stays_whole(self):
  d=lesson('dissolution');s=state(d,32)
  for ion in s['detailIons']:
   center=ion['position'];charge=ion['charge']
   for w in ion['waters']:
    o=w['oxygen'];self.assertEqual(len(w['hydrogens']),2)
    for h in w['hydrogens']:
     self.assertAlmostEqual(math.dist(o,h),math.sqrt(.2**2+.26**2))
     if charge>0:self.assertLess(math.dist(o,center),math.dist(h,center))
     else:self.assertGreater(math.dist(o,center),math.dist(h,center))
  self.assertTrue(all(w['opacity']>0 for w in state(d,18)['waters']))
  self.assertEqual(state(d,41)['detail'],0)
 def test_chromosome_and_dna_accounting(self):
  d=lesson('mitosis')
  for t,cells,chrom,dna in [(0,1,4,8),(20,1,4,8),(28,1,8,8),(35,1,8,8),(46,1,8,8),(52,2,4,4)]:
   s=state(d,t);self.assertEqual((s['cells'],s['chromosomesPerCell'],s['dnaPerCell']),(cells,chrom,dna))
   self.assertEqual(s['cells']*s['dnaPerCell'],8)
   self.assertEqual(len(s['traces']),8);self.assertEqual(len({a['id'] for a in s['traces']}),8)
   self.assertEqual(len({a['chromosomeId'] for a in s['traces']}),cells*chrom)
 def test_sisters_go_to_opposite_poles_and_keep_identity(self):
  d=lesson('mitosis');initial=state(d,0)['traces'];final=state(d,52)['traces']
  self.assertEqual([x['id'] for x in initial],[x['id'] for x in final])
  for pair in range(4):
   a,b=final[2*pair:2*pair+2];self.assertLess(a['centromere'][0],0);self.assertGreater(b['centromere'][0],0)
   self.assertEqual(a['pair'],b['pair']);self.assertEqual(a['centromere'][1:],b['centromere'][1:])
  self.assertEqual(state(d,44)['nucleiNew'],1);self.assertEqual(state(d,44)['division'],0)
  self.assertEqual(state(d,51)['division'],1)
 def test_longer_stages_slow_motion_without_changing_science(self):
  import copy
  for k in ['dissolution','mitosis']:
   original=lesson(k);slow=copy.deepcopy(original);slow['duration']*=2
   for stage in slow['stages']:stage['at']*=2
   for t in [8,18,31,45]:
    a=state(original,t);b=state(slow,t*2)
    for key in (['ions','detailIons','spread'] if k=='dissolution' else ['traces','division','chromosomesPerCell']):self.assertEqual(a[key],b[key])
 def test_seek_and_subtitle_boundaries(self):
  for k in ['mitosis','dissolution']:
   d=lesson(k);s=state(d,31.25);state(d,48);state(d,0);self.assertEqual(state(d,31.25),s)
   for st in d['stages']:
    self.assertNotEqual(state(d,st['at']+.1)['subtitle'],'')
    self.assertEqual(state(d,st['at']+st['audioDuration']+.01)['subtitle'],'')
if __name__=='__main__':unittest.main()
