"""Opens every demo route of the built prototype and records the Lucide icons that actually render, so icons
reached through tables and aliases are not missed. Writes tools/icons_runtime.json; run after build.sh, then build again."""
import json, os, pathlib
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LUCIDE = pathlib.Path("/tmp/kxtest/node_modules/lucide/dist/umd/lucide.min.js").read_text()
ROUTES = "work initiative initiative/activities session activities issues releases leaders runtimes runtime access access/people access/roles access/requests access/audit models context skills tools mcps connectors vcs operations general plan usage budgets payments login login/night login/split".split()
html = pathlib.Path(ROOT, "index.html").read_text()
page = pathlib.Path("/tmp/kxtest/icons-crawl.html")
page.write_text('<!doctype html><html><head><meta charset="utf-8">' + html.replace('<div id="root"></div>', '</head><body><div id="root"></div>', 1) + "</body></html>")
seen = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.route("**/unpkg.com/**", lambda r: r.fulfill(body=LUCIDE, content_type="application/javascript"))
    for r in ROUTES:
        pg.goto(page.as_uri() + "#" + r); pg.wait_for_timeout(700)
        for n in pg.evaluate("[...document.querySelectorAll('svg.lucide')].map(s=>[...s.classList].find(c=>c.startsWith('lucide-'))).filter(Boolean).map(c=>c.slice(7))"):
            seen.setdefault(n, set()).add(r.split("/")[0])
    b.close()
json.dump({k: sorted(v) for k, v in sorted(seen.items())}, open(os.path.join(ROOT, "tools", "icons_runtime.json"), "w"), indent=0)
print(len(seen), "icons seen")
