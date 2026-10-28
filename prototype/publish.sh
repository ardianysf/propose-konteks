#!/bin/sh
# Builds the prototype and copies it into ../site, which Vercel serves at the root.
# Also publishes the reference documents (site/docs/) and the full developer package (site/downloads/).
# Usage: sh prototype/publish.sh   (from the repo root or from prototype/)
set -e
cd "$(dirname "$0")"
sh build.sh
# The artifact host adds the document skeleton; a plain website needs it in the file.
{ printf '%s\n' '<!doctype html>' '<html lang="en">' '<head>' '<meta charset="utf-8">' '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' '<meta name="description" content="Konteks UI release: design system, component catalog, code package and the demo app.">' '<link rel="icon" href="/assets/konteks/favicon.png">'
  sed '0,/<title>[^<]*<\/title>/s//<title>Konteks UI Release<\/title>/' index.html; } > ../site/index.html
mkdir -p ../site/code ../site/docs ../site/downloads
cp code/README.md code/AGENTS.md code/components.css code/components.scoped.css code/inventory.csv code/tailwind.preset.js code/tokens.css code/tokens.live-map.css code/.stylelintrc.json ../site/code/
cp ../DESIGN.md ../PRODUCT.md ../AUDIT-STATUS.md ../docs/LIVE_PARITY.md ../docs/overlays.md ../docs/audit-ui-ux.md ../docs/konteks-audit-ui-ux.pdf ../site/docs/
mkdir -p ../site/code/react && cp code/react/* ../site/code/react/
cp code/AGENTS.md ../AGENTS.md
python3 tools/make_full_zip.py ../site/downloads/konteks-ui-lengkap.zip
echo "site/ updated"
