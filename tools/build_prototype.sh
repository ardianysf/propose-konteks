#!/bin/sh
# Builds the single-file prototype (design system + login + demo app) into .build/prototype.html.
# The parts live in their own folders; this script stitches them in a fixed order:
# components (tokens, css, primitives) -> app data -> design-system generated data -> primitives -> app shell & pages
# -> login -> design-system pages -> router last. Run from anywhere.
set -e
cd "$(dirname "$0")/.."
python3 tools/lint_colors.py
[ -d /tmp/kxtest/node_modules/lucide ] && python3 tools/icons_used.py >/dev/null || true
python3 tools/make_package.py >/dev/null
mkdir -p .build
{ cat app/shell/head.html
  echo "<style>"
  cat components/tokens/fonts.css components/tokens/fonts-alt.css components/tokens/tokens.css \
      components/css/base.css design-system/pitch.css components/css/components.css
  echo "</style>"
  echo '<div id="root"></div>'
  echo '<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>'
  echo "<script>"
  cat app/data/data.js design-system/generated/code-files.js design-system/generated/icons-used.js \
      components/js/ui.js components/js/composer.js \
      app/shell/app-shell.js app/pages/pages-work.js app/pages/pages-more.js app/login/login.js \
      app/pages/pages-customize.js app/pages/pages-settings.js \
      design-system/pages/pages-docs.js design-system/inventory.js design-system/pages/pages-catalog.js design-system/pages/pages-code.js \
      app/shell/app.js
  echo "</script>"; } > .build/prototype.html
