"""Builds the journal: a section for the landing page, /journal, and /journal/<slug>."""
import html, os, re, base64, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from journal_data import ENTRIES

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/pk/site"
SRC = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/konteks-redesign/src"

def esc(s): return html.escape(s, quote=True)
def month(e): return " ".join([e["date"].split()[0], e["date"].split()[-1]])

# ---------- covers: authored SVG in the page's own world ----------
def cover(e, mode="full"):
    """A real screen from the product, set on a palette field."""
    f = e.get("field", "moss"); shot = f'<img class="cv-shot" src="/journal-assets/{e["shot"]}.webp" alt="" loading="lazy" decoding="async">'
    if mode == "thumb":
        return f'<span class="cv cv-{f} cv-thumb" aria-hidden="true">{shot}</span>'
    return f'<span class="cv cv-{f} cv-{mode}" aria-hidden="true"><span class="cv-mk">{esc(e["mark"])}</span>{shot}</span>'

COVER_CSS = r'''
.cv{position:relative;display:block;width:100%;height:100%;overflow:hidden}
.cv-moss{background:var(--moss)}
.cv-matcha{background:var(--split-panel)}
.cv-mk{position:absolute;left:6%;top:9%;font:640 clamp(20px,7cqw,64px)/.9 var(--display);letter-spacing:-.04em;z-index:1}
.cv-moss .cv-mk{color:var(--live)}.cv-matcha .cv-mk{color:var(--accent-ink)}
.cv-shot{position:absolute;left:30%;top:28%;width:88%;height:auto;border-radius:14px;border:1px solid rgba(36,48,37,.12);box-shadow:0 30px 60px -24px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.12);transition:transform .8s var(--ease)}
.cv-thumb .cv-shot{left:12%;top:16%;width:150%;border-radius:8px}
.cv-wide .cv-shot{left:34%;top:16%;width:62%}
.cv-wide .cv-mk{font-size:clamp(28px,6cqw,88px)}
a:hover .cv-shot{transform:translate(-6px,-6px)}
'''

# ---------- the landing section ----------
def landing_section():
    f, rest = ENTRIES[0], ENTRIES[1:4]
    rows = "".join(f'''<li><a class="jrow" href="/journal/{e["slug"]}"><span class="jthumb">{cover(e,"thumb")}</span><span class="jrow-t"><span class="jmeta"><time datetime="{e["iso"]}">{e["date"]}</time><span class="jtag">{e["tag"]}</span></span><b>{esc(e["title"])}</b><span class="jdek">{esc(e["dek"])}</span></span></a></li>''' for e in rest)
    return f'''<section class="jsec" id="journal" data-rise aria-labelledby="h-journal">
  <div class="wrap">
    <div class="sec-h"><h2 id="h-journal">Notes from the part where the product becomes real.</h2><p>Launch notes, engineering scars, and the decisions behind software that remembers. From the Konteks journal.</p></div>
    <div class="jgrid">
      <a class="jfeat" href="/journal/{f["slug"]}">
        <span class="jcover"><span class="jpx" data-px="-.08">{cover(f)}</span></span>
        <span class="jfeat-t"><span class="jmeta"><time datetime="{f["iso"]}">{f["date"]}</time><span class="jtag">{f["tag"]}</span><span>{f["read"]}</span></span>
        <b class="jtitle">{esc(f["title"])}</b><span class="jdek">{esc(f["dek"])}</span><span class="jlink">Read the entry <svg class="ico"><use href="#i-arrow"/></svg></span></span>
      </a>
      <div class="jside" data-px=".06">
        <ul class="jlist">{rows}</ul>
        <a class="btn btn-line jall" href="/journal">All journal entries <svg class="ico"><use href="#i-arrow"/></svg></a>
      </div>
    </div>
  </div>
</section>'''

JSEC_CSS = r'''
/* journal on the landing page */
.jsec{padding:var(--sec) 0}
.jgrid{margin-top:clamp(40px,5vw,64px);display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:start}
.jfeat{display:grid;text-decoration:none;border-radius:24px;overflow:hidden;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-1);transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.jfeat:hover{transform:translateY(-3px);box-shadow:var(--shadow-3)}
.jcover{position:relative;display:block;aspect-ratio:16/8.5;overflow:hidden;border-bottom:1px solid var(--line)}
.jpx{position:absolute;inset:-6% 0;display:block}
.jpx .cv{padding-block:13cqh 11cqh}
.jcover .cv-q{transition:transform .8s var(--ease)}
.jfeat:hover .jcover .cv-q{transform:translateY(-4px)}
.jday{position:absolute;left:20px;bottom:16px;font:640 clamp(28px,1.2rem + 1.4vw,44px)/1 var(--display);letter-spacing:-.03em;color:#FAF8EF;text-shadow:0 2px 12px rgba(0,0,0,.35)}
.jfeat-t{display:grid;gap:12px;padding:clamp(20px,2.4vw,30px)}
.jmeta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:13px;color:var(--ink-3)}
.jtag{font-weight:600;color:var(--accent-ink);background:var(--accent-soft);border:1px solid var(--line-accent);padding:3px 8px;border-radius:999px;font-size:12px}
.jtitle{font:620 clamp(22px,1rem + 1vw,32px)/1.15 var(--display);letter-spacing:-.025em;color:var(--ink)}
.jdek{font-size:15.5px;color:var(--ink-2);line-height:1.55}
.jlink{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--accent-ink);font-size:15px}
.jlink svg{transition:transform .3s var(--ease)}.jfeat:hover .jlink svg{transform:translateX(4px)}
.jside{display:grid;gap:20px}
.jlist{list-style:none;margin:0;padding:0;display:grid;border-top:1px solid var(--line-strong)}
.jrow{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;align-items:start;padding:18px 0;border-bottom:1px solid var(--line);text-decoration:none}
.jthumb{display:block;aspect-ratio:4/3;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
.jrow-t{display:grid;gap:6px}
.jrow b{font:620 18px/1.25 var(--display);letter-spacing:-.015em;color:var(--ink)}
.jrow:hover b{text-decoration:underline;text-underline-offset:.18em;text-decoration-thickness:1px}
.jrow .jdek{font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.jall{justify-self:start}
@media (max-width:600px){.jcover .jday{top:12px;left:12px;bottom:auto;font-size:22px;background:rgba(31,43,32,.85);padding:6px 12px;border-radius:12px;text-shadow:none}}
@media (max-width:900px){.jgrid{grid-template-columns:1fr}.jrow{grid-template-columns:96px minmax(0,1fr)}}
'''

# ---------- standalone pages ----------
def page(title, desc, body, extra_css, js, active="journal"):
    fonts = open(os.path.join(SRC, "fonts.css")).read()
    tokens = open(os.path.join(SRC, "tokens.css")).read()
    fb = base64.b64encode(open(os.path.join(HERE, "fonts/bricolage-grotesque-latin-wght-normal.woff2"), "rb").read()).decode()
    disp = "@font-face{font-family:'Bricolage';font-style:normal;font-display:swap;font-weight:200 800;src:url(data:font/woff2;base64," + fb + ") format('woff2')}"
    land = open(os.path.join(HERE, "landing.html")).read()
    base = land[land.index(":root{\n  --display"):land.index("/* ================= HERO")]
    foot = land[land.index("/* footer */"):land.index("/* ===== motion additions")]
    sym = land[land.index('<svg width="0" height="0"'):land.index("</svg>", land.index('<svg width="0" height="0"')) + 6]
    navh = land[land.index('<header class="nav"'):land.index("</header>") + 9]
    fs = land.index('<footer class="foot moss">'); footh = land[fs:land.index("</footer>", fs) + 9]
    for a in ("product", "workflow", "sessions", "enablement", "connect", "top"):
        navh = navh.replace(f'href="#{a}"', f'href="/#{a}"'); footh = footh.replace(f'href="#{a}"', f'href="/#{a}"')
    navh = navh.replace(f'href="/{active}"', f'href="/{active}" aria-current="page"', 1)
    logo = "data:image/png;base64," + base64.b64encode(open(os.path.join(HERE, "assets/konteks.png"), "rb").read()).decode()
    out = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<script>document.documentElement.classList.add("js");try{{var t=localStorage.getItem("kx-theme")||localStorage.getItem("kx-lp-theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<style>
@view-transition{{navigation:auto}}
{fonts}
{disp}
{tokens}
{base}
{foot}
{COVER_CSS}
{extra_css}
@media (prefers-reduced-motion:reduce){{*,*::before,*::after{{transition-duration:.01ms!important;animation-duration:.01ms!important}}}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{sym}
{navh}
<main id="main">
{body}
</main>
{footh}
<script>
{js}
</script>
<script src="/kx-views.js" defer></script>
</body>
</html>'''
    return out.replace("@@IMG:konteks@@", logo)

COMMON_JS = r'''
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
$("#theme").onclick = () => { const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; try { localStorage.setItem("kx-theme", r.dataset.theme); } catch (e) {} };
$$(".menu-pop a").forEach(a => a.addEventListener("click", () => $(".menu").removeAttribute("open")));
const nav = $("#nav"); const stuck = () => nav.classList.toggle("stuck", scrollY > 8); addEventListener("scroll", stuck, { passive: true }); stuck();
'''

PAGE_CSS = r'''
.nav-links a[aria-current="page"]{color:var(--ink);background:var(--hover)}
.jx-head{padding:clamp(56px,8vw,112px) 0 clamp(32px,4vw,56px)}
.jx-head h1{font-size:clamp(2.4rem,1.4rem + 3.4vw,4.75rem);letter-spacing:-.04em;max-width:16ch;line-height:1}
.jx-head p{margin-top:20px;font-size:clamp(17px,1rem + .3vw,20px);color:var(--ink-2);max-width:52ch}
.crumb{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--accent-ink);text-decoration:none;margin-bottom:28px}
.crumb svg{transform:rotate(180deg);transition:transform .3s var(--ease)}
.crumb:hover svg{transform:rotate(180deg) translateX(3px)}
.jmeta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:13.5px;color:var(--ink-3)}
.jtag{font-weight:600;color:var(--accent-ink);background:var(--accent-soft);border:1px solid var(--line-accent);padding:3px 9px;border-radius:999px;font-size:12px}
/* index */
.jfilters{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}
.jfilters button{all:unset;cursor:pointer;font:600 14px/1 var(--sans);padding:10px 14px;border-radius:999px;border:1px solid var(--line-strong);color:var(--ink-2);transition:background .2s,color .2s,border-color .2s}
.jfilters button:hover{background:var(--hover);color:var(--ink)}
.jfilters button[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.jfilters button:focus-visible{outline:2px solid var(--accent-strong);outline-offset:2px}
.jfilters span{font-weight:500;opacity:.7;margin-left:6px}
.jlead{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);border-radius:28px;overflow:hidden;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-2);text-decoration:none;transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.jlead:hover{transform:translateY(-3px);box-shadow:var(--shadow-3)}
.jlead .jc{position:relative;min-height:340px;overflow:hidden}
.jlead .jc .cv{position:absolute;inset:0}
.jlead .jday{position:absolute;left:24px;bottom:20px;font:640 clamp(36px,1.6rem + 1.8vw,60px)/1 var(--display);letter-spacing:-.03em;color:#FAF8EF;text-shadow:0 2px 14px rgba(0,0,0,.35)}
.jlead .jt{display:grid;gap:14px;align-content:center;padding:clamp(24px,3.4vw,48px)}
.jlead h2{font-size:clamp(26px,1.2rem + 1.4vw,40px);line-height:1.1}
.jlead p{font-size:16.5px;color:var(--ink-2)}
.jlink{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--accent-ink);font-size:15px}
.jlink svg{transition:transform .3s var(--ease)}.jlead:hover .jlink svg,.jitem:hover .jlink svg{transform:translateX(4px)}
.jarchive{margin-top:clamp(56px,7vw,96px);padding-bottom:var(--sec)}
.jarch-h{font:620 clamp(24px,1.1rem + 1vw,34px)/1.1 var(--display);letter-spacing:-.02em;margin-bottom:20px}
.jlead[hidden]{display:none}
.jmonth{display:grid;grid-template-columns:200px minmax(0,1fr);gap:24px;border-top:1px solid var(--line-strong);padding-top:20px;margin-top:8px}
.jmonth h2{font:620 20px/1.2 var(--display);letter-spacing:-.015em;position:sticky;top:88px;align-self:start}
.jmonth ol{list-style:none;margin:0;padding:0}
.jitem{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:28px;align-items:center;padding:0 0 28px;margin-bottom:28px;border-bottom:1px solid var(--line);text-decoration:none}
.jmonth li:last-child .jitem{border-bottom:0;margin-bottom:0}
.jitem .jt{display:grid;gap:10px}
.jitem h3{font:620 clamp(21px,1rem + .8vw,28px)/1.2 var(--display);letter-spacing:-.02em}
.jitem:hover h3{text-decoration:underline;text-underline-offset:.16em;text-decoration-thickness:1px}
.jitem p{font-size:15.5px;color:var(--ink-2);max-width:60ch}
.jitem .jth{aspect-ratio:4/3;border-radius:16px;overflow:hidden;border:1px solid var(--line)}
.jempty{padding:40px 0;color:var(--ink-3)}
@media (max-width:600px){.jlead .jday{top:12px;left:12px;bottom:auto;font-size:24px;background:rgba(31,43,32,.85);padding:6px 12px;border-radius:12px;text-shadow:none}}
@media (max-width:900px){.jlead{grid-template-columns:1fr}.jlead .jc{min-height:220px}.jmonth{grid-template-columns:1fr;gap:12px}.jmonth h2{position:static}.jitem{grid-template-columns:1fr}.jitem .jth{order:-1;aspect-ratio:16/8}}
/* article */
.progress{position:fixed;left:0;right:0;top:64px;height:3px;z-index:31;background:transparent;pointer-events:none}
.progress b{display:block;height:100%;background:var(--accent-strong);transform-origin:left;transform:scaleX(var(--rp,0))}
.ahead{padding:clamp(40px,6vw,88px) 0 clamp(28px,3vw,40px)}
.ahead h1{margin-top:16px;font-size:clamp(2.2rem,1.3rem + 3vw,4.25rem);letter-spacing:-.04em;line-height:1.02;max-width:20ch}
.ahead .dek{margin-top:20px;font-size:clamp(18px,1rem + .4vw,21px);color:var(--ink-2);max-width:60ch;line-height:1.55}
.byline{margin-top:24px;display:flex;align-items:center;gap:12px;font-size:14.5px;color:var(--ink-2)}
.byline img{width:44px;height:auto;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:6px}
html[data-theme="dark"] .byline img{filter:invert(.92) hue-rotate(180deg)}
@media (prefers-color-scheme:dark){html:not([data-theme="light"]) .byline img{filter:invert(.92) hue-rotate(180deg)}}
.acover{border-radius:28px;overflow:hidden;aspect-ratio:16/7;border:1px solid var(--line);box-shadow:var(--shadow-2)}
.alayout{display:grid;grid-template-columns:220px minmax(0,1fr) 220px;gap:clamp(24px,4vw,56px);padding:clamp(40px,5vw,72px) 0 clamp(56px,6vw,88px)}
.toc{position:sticky;top:100px;align-self:start;font-size:14px}
.toc b{display:block;font:600 13px/1 var(--sans);color:var(--ink-3);margin-bottom:12px}
.toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--line-strong)}
.toc a{display:block;padding:7px 0 7px 14px;margin-left:-1px;border-left:2px solid transparent;color:var(--ink-3);text-decoration:none;line-height:1.35;transition:color .2s,border-color .2s}
.toc a:hover{color:var(--ink)}
.toc a.on{color:var(--ink);border-left-color:var(--accent-strong);font-weight:600}
.prose{max-width:68ch;font-size:18px;line-height:1.72;color:var(--ink)}
.prose > * + *{margin-top:1.1em}
.prose h2{font:620 clamp(24px,1.1rem + .9vw,32px)/1.15 var(--display);letter-spacing:-.02em;margin-top:2.2em;scroll-margin-top:96px}
.prose p{color:color-mix(in srgb,var(--ink) 88%,var(--paper))}
.prose b{font-weight:650;color:var(--ink)}
.prose a{color:var(--accent-ink);text-decoration-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.prose ul,.prose ol{padding-left:1.3em}
.prose li + li{margin-top:.45em}
.prose li::marker{color:var(--accent)}
.prose pre{font:500 14px/1.7 var(--mono);background:var(--moss);color:var(--on-moss);border-radius:16px;padding:20px 22px;overflow-x:auto;white-space:pre}
.prose blockquote{margin:1.8em 0;padding:4px 0 4px 24px;border-left:3px solid var(--accent-strong);font:560 clamp(22px,1rem + .9vw,30px)/1.3 var(--display);letter-spacing:-.02em;color:var(--ink)}
.aside{position:sticky;top:100px;align-self:start;display:grid;gap:12px;font-size:14px}
.aside .btn{--h:42px;font-size:14px;padding:0 16px;justify-content:center}
.share{all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:999px;border:1px solid var(--line-strong);font:600 14px/1 var(--sans);color:var(--ink)}
.share:hover{background:var(--hover)}
.share:focus-visible{outline:2px solid var(--accent-strong);outline-offset:2px}
.aside p{color:var(--ink-3);font-size:13px;line-height:1.5}
.aend{border-top:1px solid var(--line-strong);padding:clamp(40px,5vw,64px) 0 var(--sec)}
.cta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 40px;align-items:center;padding:clamp(24px,3vw,40px);border-radius:24px;background:var(--moss);color:var(--on-moss)}
.cta h2{font-size:clamp(24px,1.1rem + 1.2vw,36px)}
.cta p{margin-top:8px;color:var(--on-moss-2);font-size:16px}
.cta .acts{display:flex;flex-wrap:wrap;gap:12px}
.cta .btn-go{background:var(--live);color:#1F2B20}
.cta .btn-line{background:transparent;color:var(--on-moss);border-color:var(--moss-line-2)}
.pn{margin-top:clamp(40px,5vw,64px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pn a{display:grid;gap:8px;padding:22px 24px;border-radius:20px;border:1px solid var(--line);background:var(--surface);text-decoration:none;transition:transform .3s var(--ease),box-shadow .3s var(--ease)}
.pn a:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.pn span{font-size:13px;color:var(--ink-3);display:flex;align-items:center;gap:6px}
.pn b{font:620 19px/1.25 var(--display);letter-spacing:-.015em}
.pn .next{text-align:right}.pn .next span{justify-content:flex-end}
.pn .prev span svg{transform:rotate(180deg)}
.pn .none{border-style:dashed;background:transparent;color:var(--ink-3);display:grid;place-items:center;font-size:14px;border-radius:20px;border:1px dashed var(--line-strong);padding:22px}
@media (max-width:1100px){.alayout{grid-template-columns:minmax(0,1fr) 200px}.toc{display:none}}
@media (max-width:760px){.alayout{grid-template-columns:1fr}.aside{position:static;order:2;grid-template-columns:1fr 1fr}.aside p{grid-column:1/-1}.prose{font-size:17px}.acover{aspect-ratio:16/9;border-radius:20px}.cta{grid-template-columns:1fr}.pn{grid-template-columns:1fr}.pn .next{text-align:left}.pn .next span{justify-content:flex-start}}
'''

def index_page():
    tags = sorted({e["tag"] for e in ENTRIES})
    f = ENTRIES[0]
    months = {}
    for e in ENTRIES[1:]: months.setdefault(month(e), []).append(e)
    arch = ""
    for m, es in months.items():
        items = "".join(f'''<li data-tag="{esc(e["tag"])}"><a class="jitem" href="/journal/{e["slug"]}"><span class="jt"><span class="jmeta"><time datetime="{e["iso"]}">{e["date"]}</time><span class="jtag">{e["tag"]}</span><span>{e["read"]}</span></span><h3>{esc(e["title"])}</h3><p>{esc(e["dek"])}</p><span class="jlink">Read the entry <svg class="ico"><use href="#i-arrow"/></svg></span></span><span class="jth">{cover(e,"thumb")}</span></a></li>''' for e in es)
        arch += f'<section class="jmonth" data-month><h2>{m}</h2><ol>{items}</ol></section>'
    chips = f'<button type="button" aria-pressed="true" data-f="">All<span>{len(ENTRIES)}</span></button>' + "".join(f'<button type="button" aria-pressed="false" data-f="{esc(t)}">{t}<span>{sum(1 for e in ENTRIES if e["tag"] == t)}</span></button>' for t in tags)
    body = f'''<div class="wrap">
  <header class="jx-head">
    <h1>Notes from the part where the product becomes real.</h1>
    <p>Launch notes, engineering scars, and the decisions behind software that remembers.</p>
    <div class="jfilters" role="group" aria-label="Filter entries">{chips}</div>
  </header>
  <a class="jlead" href="/journal/{f["slug"]}" data-tag="{esc(f["tag"])}">
    <span class="jc">{cover(f)}</span>
    <span class="jt"><span class="jmeta"><span>Latest</span><time datetime="{f["iso"]}">{f["date"]}</time><span class="jtag">{f["tag"]}</span><span>{f["read"]}</span></span><h2>{esc(f["title"])}</h2><p>{esc(f["dek"])}</p><span class="jlink">Read the entry <svg class="ico"><use href="#i-arrow"/></svg></span></span>
  </a>
  <div class="jarchive" id="archive"><h2 class="jarch-h">Earlier entries</h2>{arch}<p class="jempty" hidden>No entries with this tag yet.</p></div>
</div>'''
    js = COMMON_JS + r'''
const btns = $$(".jfilters button");
btns.forEach(b => b.addEventListener("click", () => {
  btns.forEach(x => x.setAttribute("aria-pressed", x === b)); const f = b.dataset.f; let shown = 0;
  const lead = $(".jlead"); lead.hidden = !!f && lead.dataset.tag !== f; if (!lead.hidden) shown++;
  $$("#archive li").forEach(li => { const on = !f || li.dataset.tag === f; li.hidden = !on; if (on) shown++; });
  $$("#archive [data-month]").forEach(m => m.hidden = !$$("li:not([hidden])", m).length);
  $(".jempty").hidden = shown > 0;
}));
'''
    return page("Konteks journal: notes from the part where the product becomes real", "Launch notes, engineering scars, and the decisions behind software that remembers.", body, PAGE_CSS, js)

def article_page(i):
    e = ENTRIES[i]
    newer = ENTRIES[i - 1] if i > 0 else None
    older = ENTRIES[i + 1] if i + 1 < len(ENTRIES) else None
    parts, toc, n = [], [], 0
    for kind, val in e["body"]:
        if kind == "h2":
            n += 1; sid = re.sub(r"[^a-z0-9]+", "-", val.lower()).strip("-"); toc.append((sid, val))
            parts.append(f'<h2 id="{sid}">{esc(val)}</h2>')
        elif kind == "p": parts.append(f"<p>{val}</p>")
        elif kind == "pull": parts.append(f"<blockquote>{esc(val)}</blockquote>")
        elif kind == "pre": parts.append(f"<pre>{esc(val)}</pre>")
        elif kind in ("ul", "ol"): parts.append(f"<{kind}>" + "".join(f"<li>{esc(x)}</li>" for x in val) + f"</{kind}>")
    tocl = "".join(f'<li><a href="#{sid}">{esc(t)}</a></li>' for sid, t in toc)
    prev = f'<a class="prev" href="/journal/{older["slug"]}"><span><svg class="ico"><use href="#i-arrow"/></svg>Older entry</span><b>{esc(older["title"])}</b></a>' if older else '<span class="none">This is the first entry.</span>'
    nxt = f'<a class="next" href="/journal/{newer["slug"]}"><span>Newer entry<svg class="ico"><use href="#i-arrow"/></svg></span><b>{esc(newer["title"])}</b></a>' if newer else '<span class="none">You are reading the latest entry.</span>'
    body = f'''<div class="progress" aria-hidden="true"><b></b></div>
<article>
  <div class="wrap">
    <header class="ahead">
      <a class="crumb" href="/journal"><svg class="ico"><use href="#i-arrow"/></svg>Konteks journal</a>
      <div class="jmeta"><time datetime="{e["iso"]}">{e["date"]}</time><span class="jtag">{e["tag"]}</span><span>{e["read"]}</span></div>
      <h1>{esc(e["title"])}</h1>
      <p class="dek">{esc(e["dek"])}</p>
      <div class="byline"><img src="@@IMG:konteks@@" alt="" width="44" height="23"><span>By the Konteks team</span></div>
    </header>
    <div class="acover">{cover(e,"wide")}</div>
    <div class="alayout">
      <nav class="toc" aria-label="On this page"><b>On this page</b><ol>{tocl}</ol></nav>
      <div class="prose" id="prose">{"".join(parts)}</div>
      <aside class="aside" aria-label="Share and next steps">
        <button class="share" type="button" id="share"><svg class="ico"><use href="#i-copy"/></svg><span>Copy link</span></button>
        <a class="btn btn-go" href="/login">Open the app <svg class="ico"><use href="#i-arrow"/></svg></a>
        <p>{e["read"].capitalize()}. Published {e["date"]}.</p>
      </aside>
    </div>
    <footer class="aend">
      <div class="cta"><div><h2>Start building in Konteks.</h2><p>Or write to hello@konteks.io if you would like a human first.</p></div><div class="acts"><a class="btn btn-go" href="/#connect">Connect your agent <svg class="ico"><use href="#i-arrow"/></svg></a><a class="btn btn-line" href="mailto:hello@konteks.io">Email us</a></div></div>
      <nav class="pn" aria-label="More entries">{prev}{nxt}</nav>
    </footer>
  </div>
</article>'''
    js = COMMON_JS + r'''
const prose = $("#prose"), bar = $(".progress"), links = $$(".toc a"), heads = links.map(a => document.getElementById(a.getAttribute("href").slice(1)));
const onS = () => {
  const r = prose.getBoundingClientRect(); bar.style.setProperty("--rp", Math.max(0, Math.min(1, (innerHeight * .5 - r.top) / r.height)));
  let cur = 0; heads.forEach((h, i) => { if (h.getBoundingClientRect().top < innerHeight * .3) cur = i; });
  links.forEach((a, i) => a.classList.toggle("on", i === cur));
};
addEventListener("scroll", onS, { passive: true }); onS();
const sh = $("#share");
sh.onclick = async () => { let ok = false; try { await navigator.clipboard.writeText(location.href); ok = true; } catch (e) {} sh.querySelector("span").textContent = ok ? "Link copied" : "Copy the address bar"; setTimeout(() => sh.querySelector("span").textContent = "Copy link", 2200); };
'''
    return page(e["title"] + " | Konteks journal", e["dek"], body, PAGE_CSS, js)

if __name__ == "__main__":
    os.makedirs(os.path.join(SITE, "journal"), exist_ok=True)
    open(os.path.join(SITE, "journal.html"), "w").write(index_page())
    for i, e in enumerate(ENTRIES):
        open(os.path.join(SITE, "journal", e["slug"] + ".html"), "w").write(article_page(i))
    print("journal pages:", 1 + len(ENTRIES))
