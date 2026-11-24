#!/bin/sh
cd "$(dirname "$0")"
python3 - <<'PY'
src=open('landing.html').read()
fonts=open('../prototype/src/fonts.css').read()
tokens=open('../prototype/src/tokens.css').read()
js=open('landing.js').read()+'\n'+open('reveal.js').read()
import base64
fb=base64.b64encode(open('fonts/bricolage-grotesque-latin-wght-normal.woff2','rb').read()).decode()
disp="@font-face{font-family:'Bricolage';font-style:normal;font-display:swap;font-weight:200 800;src:url(data:font/woff2;base64,"+fb+") format('woff2')}"
out=src.replace('/*@@FONTS@@*/',fonts).replace('/*@@TOKENS@@*/',tokens).replace('/*@@SCRIPT@@*/',js).replace('/*@@DISPLAY@@*/',disp)
import re, sys
sys.path.insert(0,'.')
import journal_build as jb
out=out.replace('<!--@@JOURNAL@@-->',jb.landing_section()).replace('/*@@JCSS@@*/',jb.COVER_CSS+jb.JSEC_CSS)
for n in ['claude','codex','konteks']:
    out=out.replace('@@IMG:'+n+'@@','data:image/png;base64,'+base64.b64encode(open('assets/'+n+'.png','rb').read()).decode())
open('../site/index.html','w').write(out)
print(len(out))
PY
cp kx-views.js ../site/kx-views.js
python3 journal_build.py ../site ../prototype/src
python3 pages_build.py ../site ../prototype/src
python3 site_pages.py ../site ../prototype/src
