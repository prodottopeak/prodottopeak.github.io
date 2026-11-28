import copy,importlib.util,json,unittest,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('studio',ROOT/'scripts/build-studio.py');studio=importlib.util.module_from_spec(spec);spec.loader.exec_module(studio)
class CatalogueTests(unittest.TestCase):
 def setUp(self):self.data=json.loads((ROOT/'content/studio.json').read_text())
 def test_growing_catalogue_does_not_expand_home_or_footer(self):
  original=studio.navigation(self.data)
  future_count=6
  expected_count=len(self.data['apps'])+future_count
  for n in range(future_count):
   app=copy.deepcopy(self.data['apps'][0]);app.update(id=f'future-{n}',name=f'Future {n}',url=f'/future-{n}/',featured=False);self.data['apps'].append(app)
  studio.validate(self.data)
  self.assertEqual(len(self.data['apps']),expected_count)
  self.assertEqual(sum(a.get('featured', False) for a in self.data['apps']),4)
  self.assertEqual(studio.navigation(self.data),original)
  self.assertEqual(''.join(studio.card(a,True) for a in self.data['apps']).count('<article>'),expected_count)
 def test_rejects_duplicate_id_and_fifth_feature(self):
  self.data['apps'].append(copy.deepcopy(self.data['apps'][0]))
  with self.assertRaises(ValueError):studio.validate(self.data)
  self.data['apps'][-1]['id']='fifth'
  with self.assertRaises(ValueError):studio.validate(self.data)
 def test_rejects_unsafe_path(self):
  self.data['apps'][0]['url']='//example.com'
  with self.assertRaises(ValueError):studio.validate(self.data)
 def test_footerless_legal_page_preserves_legal_content(self):
  with tempfile.TemporaryDirectory() as directory:
   page=Path(directory)/'index.html';legal='<main><h1>Privacy</h1><p>Original policy text.</p></main>'
   page.write_text('<html><link rel="canonical" href="https://prodottopeak.com/keli/privacy/"><body>'+legal+'</body></html>')
   self.assertTrue(studio.render_file(page,self.data));result=page.read_text();self.assertIn(legal,result);self.assertIn('/assets/studio-footer.css',result);self.assertLess(result.index('/assets/studio-footer.css'),result.index('<body>'));self.assertEqual(result.count('class="pp-studio"'),1);self.assertFalse(studio.render_file(page,self.data))
 def test_card_escapes_text(self):
  a=self.data['apps'][0];a['name']='<script>unsafe</script>'
  self.assertNotIn('<script>',studio.card(a));self.assertIn('&lt;script&gt;',studio.card(a))
 def test_generated_region_preserves_surrounding_content(self):
  s='<p>Local support</p><!-- STUDIO:START -->old<!-- STUDIO:END --><p>Local privacy</p>'
  result=studio.block(s,'STUDIO','new');self.assertTrue(result.startswith('<p>Local support</p>'));self.assertTrue(result.endswith('<p>Local privacy</p>'));self.assertEqual(result,studio.block(result,'STUDIO','new'))
if __name__=='__main__':unittest.main()
