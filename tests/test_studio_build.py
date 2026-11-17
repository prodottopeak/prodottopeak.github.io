import copy,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('studio',ROOT/'scripts/build-studio.py');studio=importlib.util.module_from_spec(spec);spec.loader.exec_module(studio)
class CatalogueTests(unittest.TestCase):
 def setUp(self):self.data=json.loads((ROOT/'content/studio.json').read_text())
 def test_ten_apps_do_not_expand_home_or_footer(self):
  original=studio.navigation(self.data)
  for n in range(6):
   app=copy.deepcopy(self.data['apps'][0]);app.update(id=f'future-{n}',name=f'Future {n}',url=f'/future-{n}/',featured=False);self.data['apps'].append(app)
  studio.validate(self.data)
  self.assertEqual(len(self.data['apps']),10)
  self.assertEqual(sum(a['featured'] for a in self.data['apps']),4)
  self.assertEqual(studio.navigation(self.data),original)
  self.assertEqual(''.join(studio.card(a,True) for a in self.data['apps']).count('<article>'),10)
 def test_rejects_duplicate_id_and_fifth_feature(self):
  self.data['apps'].append(copy.deepcopy(self.data['apps'][0]))
  with self.assertRaises(ValueError):studio.validate(self.data)
  self.data['apps'][-1]['id']='fifth'
  with self.assertRaises(ValueError):studio.validate(self.data)
 def test_rejects_unsafe_path(self):
  self.data['apps'][0]['url']='//example.com'
  with self.assertRaises(ValueError):studio.validate(self.data)
 def test_card_escapes_text(self):
  a=self.data['apps'][0];a['name']='<script>unsafe</script>'
  self.assertNotIn('<script>',studio.card(a));self.assertIn('&lt;script&gt;',studio.card(a))
 def test_generated_region_preserves_surrounding_content(self):
  s='<p>Local support</p><!-- STUDIO:START -->old<!-- STUDIO:END --><p>Local privacy</p>'
  result=studio.block(s,'STUDIO','new');self.assertTrue(result.startswith('<p>Local support</p>'));self.assertTrue(result.endswith('<p>Local privacy</p>'));self.assertEqual(result,studio.block(result,'STUDIO','new'))
if __name__=='__main__':unittest.main()
