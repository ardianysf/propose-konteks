"""Render docs/audit-ui-ux.md as the editorial A4 PDF (docs/konteks-audit-ui-ux.pdf) with the prototype fonts. Needs Python packages markdown, beautifulsoup4, playwright."""
import re, pathlib, markdown
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
md = (HERE.parent / "audit-ui-ux.md").read_text()
# Typographic quotes for the printed edition.
md = re.sub(r'"([^"\n]*?)"', "\u201c\\1\u201d", md)
fonts = (HERE.parent.parent / "prototype" / "src" / "fonts.css").read_text()

# Severity and status per finding, from the module index tables.
meta = {}
for m in re.finditer(r"^\| (UX-\d+|DS-\d+) \|.*?\| (High|Medium|Low|Critical) \| ([^|]+) \|$", md, re.M):
    meta[m.group(1)] = (m.group(2), m.group(3).strip())

# Title block is drawn as the cover; the body starts at the executive summary.
body_md = md.split("## Ringkasan eksekutif", 1)[1]
body_md = "## Ringkasan eksekutif" + body_md
html = markdown.markdown(body_md, extensions=["tables", "sane_lists"])
soup = BeautifulSoup(html, "html.parser")

SEV = {"High": "high", "Medium": "med", "Low": "low", "Critical": "high"}
def sev_tag(sev):
    t = soup.new_tag("span", attrs={"class": f"sev sev-{SEV[sev]}"}); t.string = sev; return t

# Severity cells in tables get the dot treatment.
for td in soup.find_all("td"):
    txt = td.get_text(strip=True)
    if txt in SEV: td.clear(); td.append(sev_tag(txt))
    if re.fullmatch(r"(UX|DS)-\d+", txt) or re.fullmatch(r"M\d\d-F\d\d", txt): td["class"] = td.get("class", []) + ["id"]

# Tables: classify by header so each gets its own column widths.
for tb in soup.find_all("table"):
    heads = [th.get_text(strip=True) for th in tb.find_all("th")]
    kind = {"Severity": "t-sum", "Aspek": "t-kv", "ID": "t-ds" if "Area" in heads else ("t-inv" if "Modul" in heads else "t-idx"),
            "Halaman": "t-resp", "Pemeriksaan": "t-a11y"}.get(heads[0], "")
    tb["class"] = ["tbl", kind]

# Findings: h4 + its list become one block with an ID, title, severity and status, and a label grid.
for h4 in soup.find_all("h4"):
    m = re.match(r"((?:UX|DS)-\d+)\s+(.*)", h4.get_text())
    if not m: continue
    fid, title = m.groups()
    sev, st = meta.get(fid, ("", ""))
    sec = soup.new_tag("section", attrs={"class": "finding", "id": fid})
    head = soup.new_tag("div", attrs={"class": "f-h"})
    idt = soup.new_tag("span", attrs={"class": "f-id"}); idt.string = fid
    h = soup.new_tag("h4"); h.string = title
    side = soup.new_tag("div", attrs={"class": "f-meta"})
    if sev: side.append(sev_tag(sev))
    if st: s_ = soup.new_tag("span", attrs={"class": "f-st"}); s_.string = st; side.append(s_)
    head.extend([idt, h, side]); sec.append(head)
    nxt = h4.find_next_sibling()
    h4.replace_with(sec)
    if nxt is not None and nxt.name == "ul":
        dl = soup.new_tag("dl", attrs={"class": "f-dl"})
        for li in nxt.find_all("li", recursive=False):
            strong = li.find("strong")
            label = strong.get_text().rstrip(":") if strong else ""
            if strong: strong.extract()
            dt = soup.new_tag("dt"); dt.string = label
            dd = soup.new_tag("dd")
            for c in list(li.contents): dd.append(c)
            if dd.contents and isinstance(dd.contents[0], str): dd.contents[0].replace_with(dd.contents[0].lstrip())
            dl.extend([dt, dd])
        nxt.extract(); sec.append(dl)

# "Pola yang baik" paragraphs become a quiet callout.
for p in soup.find_all("p"):
    st = p.find("strong")
    if st and st.get_text().startswith("Pola yang baik"): p["class"] = ["good"]

# Major sections start on a new page.
for h2 in soup.find_all("h2"):
    if h2.get_text() != "Ringkasan eksekutif": h2["class"] = ["newpage"]

# Section numbering for the contents list on the cover.
toc = [h2.get_text() for h2 in soup.find_all("h2")]

cover = f"""
<section class="cover">
  <div class="mark"><span>K</span>Konteks<i>Audit UI/UX · app.konteks.io</i></div>
  <div class="c-main">
    <h1>Konteks hari ini: apa yang sudah kuat, dan apa yang membuatnya belum terasa utuh</h1>
    <p class="c-lede">Pemeriksaan read-only atas sepuluh modul aplikasi yang sedang berjalan. Setiap temuan ditulis dengan lokasi, observasi terukur, dampak, rekomendasi, dan kriteria penerimaan yang bisa diuji.</p>
  </div>
  <dl class="c-facts">
    <div><dt>Tanggal</dt><dd>27 Oktober 2026</dd></div>
    <div><dt>Penulis</dt><dd>Ardian Yusuf</dd></div>
    <div><dt>Cakupan</dt><dd>10 modul · 46 fitur</dd></div>
    <div><dt>Temuan</dt><dd>56 (45 UX, 11 sistem desain)</dd></div>
  </dl>
  <div class="c-sev">
    <div><b>3</b><span class="sev sev-high">High</span></div>
    <div><b>34</b><span class="sev sev-med">Medium</span></div>
    <div><b>19</b><span class="sev sev-low">Low</span></div>
    <div><b>0</b><span class="sev sev-low">Critical</span></div>
  </div>
  <ol class="c-toc">{''.join(f'<li>{t}</li>' for t in toc)}</ol>
  <p class="c-note">Nama System, orang, perangkat, dan kredensial disamarkan. Tidak ada data yang diubah selama audit.</p>
</section>"""

css = """
@page{size:A4;margin:22mm 20mm 20mm 20mm}
@page:first{margin:0}
:root{--ink:#243025;--ink2:#4D644F;--ink3:#5E705E;--line:#E5E7D9;--line2:#D3D8C4;--accent:#4F7044;--soft:#EEF3E6;--ground:#FAF8EF;--warn:#9A6212;--danger:#B3261E;--info:#2F6F8F}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Inter,system-ui,sans-serif;font-size:9.6pt;line-height:1.55;color:var(--ink);font-feature-settings:"cv11","ss01";hyphens:manual}
code{font-family:'JetBrains Mono',monospace;font-size:.88em;background:var(--soft);padding:0 .25em;border-radius:3px}
/* cover */
.cover{height:297mm;padding:22mm 20mm 18mm;background:var(--ground);display:flex;flex-direction:column;break-after:page;position:relative}
.mark{display:flex;align-items:center;gap:8px;font-weight:600;font-size:11pt}
.mark span{width:22px;height:22px;border-radius:6px;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:10pt;font-weight:700}
.c-main{margin-top:46mm;max-width:150mm}
.mark i{font-style:normal;font-weight:400;color:var(--ink3);margin-left:4mm;padding-left:4mm;border-left:1px solid var(--line2)}
.cover h1{font-size:30pt;line-height:1.12;letter-spacing:-.022em;font-weight:600;margin:0;text-wrap:balance}
.c-lede{font-size:12pt;line-height:1.55;color:var(--ink2);margin:8mm 0 0;max-width:132mm}
.c-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin:18mm 0 0;padding-top:5mm;border-top:1px solid var(--line2)}
.c-facts dt{font-size:8pt;color:var(--ink3);margin-bottom:1mm}
.c-facts dd{margin:0;font-weight:500;font-size:9.6pt}
.c-sev{display:flex;gap:10mm;margin-top:10mm}
.c-sev div{display:flex;align-items:baseline;gap:3mm}
.c-sev b{font-size:22pt;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.c-toc{margin:auto 0 0;padding:5mm 0 0;border-top:1px solid var(--line2);columns:2;column-gap:12mm;font-size:9pt;color:var(--ink2);list-style:decimal-leading-zero inside}
.c-toc li{padding:1.2mm 0}
.c-note{font-size:8pt;color:var(--ink3);margin:6mm 0 0}
/* body */
h2{font-size:18pt;line-height:1.2;letter-spacing:-.015em;font-weight:600;margin:0 0 5mm}
h2.newpage{break-before:page}
h3{font-size:12pt;font-weight:600;margin:9mm 0 3mm;break-after:avoid}
p{margin:0 0 3mm;max-width:158mm}
ul,ol{margin:0 0 4mm;padding-left:5mm}
li{margin:0 0 1.5mm}
li::marker{color:var(--ink3)}
strong{font-weight:600}
em{font-style:normal;color:var(--ink2);font-weight:500}
blockquote{margin:5mm 0;padding:4mm 5mm;background:var(--soft);border-radius:6px;color:var(--ink)}
blockquote p{margin:0}
p.good{background:var(--ground);border:1px solid var(--line);border-radius:6px;padding:3mm 4mm;color:var(--ink2)}
p.good strong{color:var(--accent)}
/* tables */
.tbl{width:100%;border-collapse:collapse;margin:2mm 0 5mm;font-size:8.6pt;line-height:1.45}
.tbl th{text-align:left;font-weight:500;color:var(--ink3);font-size:7.8pt;padding:1.8mm 2.5mm;border-bottom:1px solid var(--line2);vertical-align:bottom}
.tbl td{padding:2.2mm 2.5mm;border-bottom:1px solid var(--line);vertical-align:top}
.tbl tr{break-inside:avoid}
.tbl td.id{font-family:'JetBrains Mono',monospace;font-size:7.8pt;color:var(--ink2);white-space:nowrap}
.t-sum{width:auto;min-width:90mm}.t-sum td,.t-sum th{padding-right:8mm}
.t-kv td:first-child{width:38mm;color:var(--ink2);font-weight:500}
.t-ds td:nth-child(2){width:22mm;font-weight:500}.t-ds td:nth-child(4){width:18mm}.t-ds td:nth-child(5){width:24mm;color:var(--ink2)}
.t-idx td:nth-child(3){width:20mm}.t-idx td:nth-child(4){width:30mm;color:var(--ink2)}
.t-inv{font-size:7.8pt}.t-inv td:nth-child(5){white-space:nowrap}
.t-a11y td:first-child{width:46mm;font-weight:500}.t-a11y td:last-child{width:26mm;color:var(--ink2)}
.t-resp td:first-child{font-weight:500;width:30mm}
/* severity */
.sev{display:inline-flex;align-items:center;gap:1.4mm;font-size:8pt;font-weight:500;white-space:nowrap}
.sev::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.sev-high{color:var(--danger)}.sev-med{color:var(--warn)}.sev-low{color:var(--ink3)}
/* findings */
.finding{break-inside:avoid;border-top:1px solid var(--line2);padding:4mm 0 3mm;margin:0}
.f-h{display:grid;grid-template-columns:17mm 1fr auto;gap:3mm;align-items:baseline;margin-bottom:2.5mm}
.f-id{font-family:'JetBrains Mono',monospace;font-size:8pt;color:var(--ink3)}
.f-h h4{margin:0;font-size:10.4pt;font-weight:600;line-height:1.35}
.f-meta{display:flex;gap:3mm;align-items:baseline}
.f-st{font-size:8pt;color:var(--ink3)}
.f-dl{display:grid;grid-template-columns:31mm 1fr;gap:1.6mm 3mm;margin:0 0 0 20mm}
.f-dl dt{font-size:8pt;color:var(--ink3);font-weight:500;padding-top:.5mm}
.f-dl dd{margin:0}
"""

doc = f"<!doctype html><html lang='id'><head><meta charset='utf-8'><title>Audit UI/UX Konteks</title><style>{fonts}{css}</style></head><body>{cover}<main>{soup}</main></body></html>"
(HERE / "audit.html").write_text(doc)

footer = """<div style="width:100%;font-family:Inter,sans-serif;font-size:7px;color:#5E705E;padding:0 20mm;display:flex;justify-content:space-between">
<span>Audit UI/UX Konteks · 27 Oktober 2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto((HERE / "audit.html").as_uri()); pg.wait_for_timeout(300)
    pg.pdf(path=str(HERE.parent / "konteks-audit-ui-ux.pdf"), format="A4", print_background=True, prefer_css_page_size=True,
           display_header_footer=True, header_template="<span></span>", footer_template=footer)
    b.close()
print("ok", meta.__len__())
