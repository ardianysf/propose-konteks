# Tools

| File | What it does |
|---|---|
| `build_prototype.sh` | Stitches components, app, login and design system, in dependency order, into `.build/prototype.html`. |
| `publish.sh` | Runs the build and publishes `site/prototype.html`, `site/code/`, `site/docs/`, `site/downloads/`. |
| `lint_colors.py` | Fails the build on a raw colour outside `components/tokens/tokens.css`. |
| `make_package.py` | Writes `components/package/` and `design-system/generated/code-files.js`. |
| `make_full_zip.py` | Builds `site/downloads/konteks-ui-lengkap.zip`. |
| `icons_used.py`, `icons_crawl.py` | Collect the Lucide icons in use into `design-system/generated/icons-used.js` (need a local Lucide install). |
