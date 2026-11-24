#!/bin/sh
# Builds the prototype into site/prototype.html. Vercel serves that one file at /design-system, /login and /app
# (vercel.json rewrites); the path picks the view. The landing page at / is built by landing/build.sh.
# Also publishes the reference documents (site/docs/) and the developer package (site/code/, site/downloads/).
set -e
cd "$(dirname "$0")/.."
sh tools/build_prototype.sh
# The artifact host adds the document skeleton; a plain website needs it in the file.
{ printf '%s\n' '<!doctype html>' '<html lang="en">' '<head>' '<meta charset="utf-8">' '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' '<meta name="description" content="Konteks UI release: design system, component catalog, code package and the demo app.">' '<link rel="icon" href="/assets/konteks/favicon.png">'
  sed '0,/<title>[^<]*<\/title>/s//<title>Konteks UI Release<\/title>/' .build/prototype.html; echo '<script src="/kx-views.js" defer></script>'; } > site/prototype.html
mkdir -p site/code site/docs site/downloads site/code/react
PKG=components/package
cp $PKG/README.md $PKG/AGENTS.md $PKG/components.css $PKG/components.scoped.css $PKG/inventory.csv $PKG/tailwind.preset.js $PKG/tokens.css $PKG/tokens.live-map.css $PKG/.stylelintrc.json site/code/
cp DESIGN.md PRODUCT.md AUDIT-STATUS.md docs/LIVE_PARITY.md docs/overlays.md docs/audit-ui-ux.md docs/konteks-audit-ui-ux.pdf site/docs/
cp $PKG/react/* site/code/react/
cp $PKG/AGENTS.md AGENTS.md
python3 tools/make_full_zip.py site/downloads/konteks-ui-lengkap.zip
echo "site/ updated"
