#!/bin/sh
cd "$(dirname "$0")"
python3 - <<'PY'
src=open('landing.html').read()
fonts=open('../prototype/src/fonts.css').read()
tokens=open('../prototype/src/tokens.css').read()
js=open('landing.js').read()
out=src.replace('/*@@FONTS@@*/',fonts).replace('/*@@TOKENS@@*/',tokens).replace('/*@@SCRIPT@@*/',js)
open('../site/landingpage.html','w').write(out)
print(len(out))
PY
