import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('builder', ROOT/'skills/classroom-lab/scripts/build.py')
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class BuilderTests(unittest.TestCase):
    def setUp(self):
        self.lesson=json.loads((ROOT/'skills/classroom-lab/assets/lever-demo/lesson.json').read_text())
        for stage in self.lesson['stages']:
            stage.pop('audioFile',None);stage.pop('audioDuration',None)

    def test_rejects_impossible_parameters(self):
        for change in [{'min':30,'max':20},{'step':0},{'value':25},{'value':float('nan')},{'value':400}]:
            with self.subTest(change=change):
                data=copy.deepcopy(self.lesson);data['parameters'][2].update(change)
                with self.assertRaises(ValueError):builder.validate(data)

    def test_rejects_bad_stage_state(self):
        for values in [{'distance':45},{'unknown':1},{'distance':25}]:
            with self.subTest(values=values):
                data=copy.deepcopy(self.lesson);data['stages'][1]['values']=values
                with self.assertRaises(ValueError):builder.validate(data)
        self.lesson['stages'][1]['at']=0
        with self.assertRaises(ValueError):builder.validate(self.lesson)

    def test_untrusted_text_cannot_close_data_script(self):
        self.lesson['title']='</script><script>alert(1)</script>'
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);(p/'lesson.json').write_text(json.dumps(self.lesson));(p/'scene.js').write_text('function createExperiment(svg){return {render(){}}}')
            out=builder.build(p/'lesson.json',p/'scene.js',p/'index.html')
            result=out.read_text()
            self.assertNotIn('<script>alert(1)',result)
            self.assertIn('\\u003c/script\\u003e',result)
            self.assertNotIn('@@SCENE_JS@@',result)
            with self.assertRaises(FileExistsError):builder.build(p/'lesson.json',p/'scene.js',out)
            self.assertEqual(result,out.read_text())
            builder.build(p/'lesson.json',p/'scene.js',out,force=True)

    def test_no_parameters_is_valid(self):
        self.lesson['parameters']=[]
        for s in self.lesson['stages']:s.pop('values',None)
        builder.validate(self.lesson)

    def test_audio_must_fit_stage(self):
        self.lesson['stages'][0]['audioDuration']=20
        with self.assertRaises(ValueError):builder.validate(self.lesson)

    def test_source_schemes(self):
        self.lesson['sources'][0]['url']='javascript:alert(1)'
        with self.assertRaises(ValueError):builder.validate(self.lesson)

if __name__=='__main__':unittest.main()
