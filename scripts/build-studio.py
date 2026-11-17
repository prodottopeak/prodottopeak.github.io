#!/usr/bin/env python3
"""Generate the studio catalogue and shared navigation using only the standard library.
Run with --all-sites from the studio checkout to update sibling product websites too.
Does not commit, push, change native apps, or send any external requests.
"""
from pathlib import Path
import argparse,base64,hashlib,html,json,re,datetime,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
START='<!-- STUDIO:START -->'; END='<!-- STUDIO:END -->'
def esc(s):return html.escape(s,quote=True)
def block(s,key,value):
    pattern=rf'<!-- {key}:START -->.*?<!-- {key}:END -->'
    if not re.search(pattern,s,re.S):raise ValueError(f'Missing generated region: {key}')
    return re.sub(pattern,lambda _:f'<!-- {key}:START -->{value}<!-- {key}:END -->',s,flags=re.S)
def validate(data):
    ids=set()
    for app in data['apps']:
        if app['id'] in ids or not re.fullmatch('[a-z0-9-]+',app['id']):raise ValueError('Invalid or duplicate app id')
        ids.add(app['id'])
        if app['status'] not in ['available','coming_soon']:raise ValueError('Invalid launch status')
        for key in ['url','art','support','privacy']:
            if not app[key].startswith('/') or app[key].startswith('//') or '..' in app[key]:raise ValueError(f'Invalid local URL: {key}')
        if not re.fullmatch('[a-zA-Z0-9.-]+',app['repo']) or '..' in app['repo']:raise ValueError('Invalid repository')
        if Path(app['site_dir']).is_absolute() or '..' in Path(app['site_dir']).parts:raise ValueError('Invalid site directory')
    if sum(a.get('featured',False) for a in data['apps'])>4:raise ValueError('Select at most four featured apps; the directory contains every app.')
def card(a,directory=False):
    soon=' · Coming soon' if a['status']=='coming_soon' else ''
    body=f'''<a class="app-card {esc(a['id'])}-card" href="{esc(a['url'])}" aria-labelledby="{esc(a['id'])}-name {esc(a['id'])}-job"><div class="card-art {esc(a['id'])}-art" aria-hidden="true"><img src="{esc(a['art'])}" width="160" height="150" alt=""></div><div class="card-copy"><p class="card-kind">{esc(a['category'])}{soon}</p><h3 id="{esc(a['id'])}-name">{esc(a['name'])}</h3><p class="card-job" id="{esc(a['id'])}-job">{esc(a['tagline'])}</p><span class="card-link">Explore {esc(a['name'])}<span aria-hidden="true">↗</span></span></div></a>'''
    if directory:body=f'<article>{body}<nav class="directory-support" aria-label="{esc(a["name"])} help"><a href="{esc(a["support"])}">Support</a><a href="{esc(a["privacy"])}">Privacy</a></nav></article>'
    return body

def navigation(data):
    # Fixed number of navigation items: this does not grow with the catalogue.
    return f'''{START}<div class="pp-studio" lang="en"><a class="pp-studio-brand" href="/"><img src="/assets/favicon.svg" width="28" height="28" alt="">{esc(data['name'])}</a><nav class="pp-studio-links" aria-label="Prodotto Peak"><a href="/apps/">All apps</a><a href="{esc(data['services_url'])}">Build an app with us</a><a href="/apps/#app-directory">App support &amp; privacy</a><a href="mailto:{esc(data['email'])}">Say hello <span aria-hidden="true">↗</span></a></nav></div>{END}'''

def sync_schema(s,data,home=False,featured=False):
    m=re.search(r'<script type="application/ld\+json">(.*?)</script>',s,re.S)
    if not m:return s
    d=json.loads(m.group(1)); graph=d.get('@graph',[])
    if home:
        graph[:]=[x for x in graph if x.get('@type')!='ItemList']
        graph.append({'@type':'ItemList','name':'Apps by Prodotto Peak','itemListElement':[{'@type':'ListItem','position':i+1,'name':a['name'],'url':'https://prodottopeak.com'+a['url']} for i,a in enumerate([a for a in data['apps'] if not featured or a.get('featured')])]})
    text=json.dumps(d,ensure_ascii=False,separators=(',',':'))
    oldhash=base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode();newhash=base64.b64encode(hashlib.sha256(text.encode()).digest()).decode()
    return (s[:m.start(1)]+text+s[m.end(1):]).replace('sha256-'+oldhash,'sha256-'+newhash)

def render_file(path,data,is_root=False):
    s=path.read_text();original=s
    if '<footer' not in s:
        match=re.search(r'<link rel="canonical" href="https://prodottopeak.com([^"]+)"',s)
        app=next((a for a in data['apps'] if match and match[1] in [a['support'],a['privacy']]),None)
        if app:
            legal=f'<footer class="pp-legal-footer"><a class="brand" href="{esc(app["url"])}">{esc(app["name"])}</a><nav aria-label="Support"><a href="{esc(app["support"])}">Support</a><a href="{esc(app["privacy"])}">Privacy</a></nav></footer>'
            s=s.replace('</body>',legal+'</body>')
    if path==ROOT/'index.html':s=block(s,'APPS','\n'.join(card(a) for a in data['apps'] if a.get('featured')));s=sync_schema(s,data,True,True)
    if path==ROOT/'apps/index.html':s=block(s,'DIRECTORY','\n'.join(card(a,True) for a in data['apps']));s=sync_schema(s,data,True)
    if '<!-- PROOF:START -->' in s:
        links=', '.join(f'<a href="{esc(a["url"])}">{esc(a["name"])}</a>' for a in data['apps'] if a.get('featured'))
        s=block(s,'PROOF',f'<p>We build our own apps, too. Explore {links} to get a feel for our approach. See current availability in <a href="/apps/">our app directory</a>.</p>')
    if START in s:s=block(s,'STUDIO',navigation(data).removeprefix(START).removesuffix(END))
    elif re.search(r'<div class="studio">.*?</div>',s,re.S):s=re.sub(r'<div class="studio">.*?</div>',lambda _:navigation(data),s,flags=re.S)
    elif '</footer>' in s:
        s=re.sub(r'<a class="studio-home" href="/">.*?</a>','',s,flags=re.S)
        s=s.replace('<p>Made by <a href="/">Prodotto Peak</a>.</p>','')
        s=s.replace('</footer>',navigation(data)+'</footer>')
    else:return False
    s=re.sub(r'<a class="studio-home" href="/">.*?</a>','',s,flags=re.S) if path.parent.name=='_layouts' else s
    def footer_class(m):
        tag=m.group()
        if 'pp-footer' in tag:return tag
        if 'class="' in tag:return tag.replace('class="','class="pp-footer ',1)
        return tag.replace('<footer','<footer class="pp-footer"',1)
    s=re.sub(r'<footer\b[^>]*>',footer_class,s)
    css='<link rel="stylesheet" href="/assets/studio-footer.css">'
    if css not in s:
        if '</head>' in s:s=s.replace('</head>',css+'\n</head>')
        else:s=s.replace('<body',css+'<body',1)
    s=re.sub(r'<footer\b.*?</footer>',lambda m:'\n'.join(line.rstrip() for line in m.group().split('\n')),s,flags=re.S)
    if s!=original:path.write_text(s);return True
    return False

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--all-sites',action='store_true');args=ap.parse_args()
    data=json.loads((ROOT/'content/studio.json').read_text());validate(data)
    paths=[ROOT/'index.html',ROOT/'apps/index.html',ROOT/'app-development/index.html']
    for app in data['apps']:
        repo=ROOT.parent/app['repo']
        if repo!=ROOT and not args.all_sites:continue
        site=repo/app['site_dir']
        if not site.is_dir():raise SystemExit(f'Missing website checkout: {site}')
        paths.extend(p for p in site.rglob('*.html') if '.git' not in p.parts and ('<footer' in p.read_text() or any('https://prodottopeak.com'+app[k] in p.read_text() for k in ['support','privacy'])))
    changed=[]
    for p in dict.fromkeys(paths):
        if render_file(p,data):changed.append(str(p))
    sm=ROOT/'sitemap.xml';ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.parse(sm);rt=tree.getroot();existing={u.find('{'+ns+'}loc').text for u in rt}
    for url in ['/apps/',data['services_url'],*[a['url'] for a in data['apps']]]:
        full='https://prodottopeak.com'+url
        if full not in existing:
            u=ET.SubElement(rt,'{'+ns+'}url');ET.SubElement(u,'{'+ns+'}loc').text=full;ET.SubElement(u,'{'+ns+'}lastmod').text=datetime.date.today().isoformat();existing.add(full)
    ET.indent(tree,space='  ');new=ET.tostring(rt,encoding='unicode');new="<?xml version='1.0' encoding='utf-8'?>\n"+new+'\n'
    if sm.read_text()!=new:sm.write_text(new);changed.append(str(sm))
    print(json.dumps({'apps':len(data['apps']),'featured':sum(a.get('featured',False) for a in data['apps']),'changed':changed},indent=2))
if __name__=='__main__':main()
