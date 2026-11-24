#!/bin/sh
# Builds Home (/) and Features (/features) from landing.html, and the marketing pages (pricing, security, docs, about, contact, privacy, terms, journal) into ../site/.
# Shared inputs: components/tokens (fonts, tokens), app/data/data.js (agent marks), components/js/kx-views.js (View tab).
cd "$(dirname "$0")"
python3 - <<'PY'
src=open('landing.html').read()
fonts=open('../components/tokens/fonts.css').read()
tokens=open('../components/tokens/tokens.css').read()
js=open('landing.js').read()+'\n'+open('reveal.js').read()
import base64
fb=base64.b64encode(open('fonts/bricolage-grotesque-latin-wght-normal.woff2','rb').read()).decode()
disp="@font-face{font-family:'Bricolage';font-style:normal;font-display:swap;font-weight:200 800;src:url(data:font/woff2;base64,"+fb+") format('woff2')}"
out=src.replace('/*@@FONTS@@*/',fonts).replace('/*@@TOKENS@@*/',tokens).replace('/*@@SCRIPT@@*/',js).replace('/*@@DISPLAY@@*/',disp)
import re, sys
sys.path.insert(0,'.')
import journal_build as jb
out=out.replace('<!--@@JOURNAL@@-->',jb.landing_section()).replace('/*@@JCSS@@*/',jb.COVER_CSS+jb.JSEC_CSS)
# Agent marks from the design system (app/data/data.js, Foundations > Ikon > Tanda khusus), monochrome, currentColor.
import json
_d=open('../app/data/data.js').read(); _i=_d.index('const HARNESS_SVG = '); _e=_d.index('};',_i)+1
HARN=json.loads(_d[_i+len('const HARNESS_SVG = '):_e])
def _mark(m):
    parts=m.group(1).split('|'); name=parts[0]; vb,body=HARN[name][0],HARN[name][1]
    if len(parts)==1: return f'<svg class="hm" viewBox="{vb}" fill="none" aria-hidden="true" focusable="false">{body}</svg>'
    x,y,w=parts[1:4]; return f'<svg class="hm" x="{x}" y="{y}" width="{w}" height="{w}" viewBox="{vb}" fill="none" aria-hidden="true">{body}</svg>'
out=re.sub(r'@@HARN:([^@]+)@@',_mark,out)
for n in ['claude','codex','konteks']:
    out=out.replace('@@IMG:'+n+'@@','data:image/png;base64,'+base64.b64encode(open('assets/'+n+'.png','rb').read()).decode())
# One template, two pages: blocks marked <!--@@PAGE:home--> or <!--@@PAGE:features--> go to that page only.
def for_page(name, href):
    o=re.sub(r'<!--@@PAGE:(\w+)-->(.*?)<!--@@/PAGE-->', lambda m: m.group(2) if m.group(1)==name else '', out, flags=re.S)
    return o.replace(f'<a href="{href}">', f'<a href="{href}" aria-current="page">')
open('../site/index.html','w').write(for_page('home','/'))
open('../site/features.html','w').write(for_page('features','/features'))
print(len(out))
PY
cp ../components/js/kx-views.js ../site/kx-views.js
python3 journal_build.py ../site ../components/tokens
python3 pages_build.py ../site ../components/tokens
python3 site_pages.py ../site ../components/tokens

mkdir -p ../site/art && cp art/*.svg ../site/art/
mkdir -p ../site/journal-assets && cp journal-assets/*.webp ../site/journal-assets/
