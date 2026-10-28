#!/bin/sh
# Builds the single-file prototype from src/. Order matters: data and helpers first, router last.
cd "$(dirname "$0")"
python3 tools/lint_colors.py || exit 1
[ -d /tmp/kxtest/node_modules/lucide ] && python3 tools/icons_used.py >/dev/null
python3 tools/make_package.py >/dev/null
{ cat src/head.html; echo "<style>"; cat src/fonts.css src/fonts-alt.css src/tokens.css src/base.css src/pitch.css src/components.css; echo "</style>"; echo '<div id="root"></div>';
  echo '<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>';
  echo "<script>"; cat src/data.js src/code-files.js src/icons-used.js src/ui.js src/composer.js src/app-shell.js src/pages-work.js src/pages-more.js src/pages-customize.js src/pages-settings.js src/pages-docs.js src/inventory.js src/pages-catalog.js src/pages-code.js src/app.js; echo "</script>"; } > index.html
