"""Builds the Indonesian site (/id/...) from the built English pages, and points each page's language switch at its pair.

Run after every other builder (build.sh does). English stays the source of truth; i18n_id.json holds the Indonesian copy:
  text  English text node or attribute value, exactly as it appears in the built HTML -> Indonesian
  js    ordered substring replacements applied only inside <script> blocks
Privacy and Terms stay English only: their switch leads to the Indonesian home, and Indonesian pages link to them as they are.
Untranslated English left on an Indonesian page is listed when the build runs, so a new English sentence is noticed.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "site")
D = json.load(open(os.path.join(HERE, "i18n_id.json"), encoding="utf-8"))
TEXT, JS = D["text"], D["js"]

def docs_file():
    return "docs/index.html" if os.path.isfile(os.path.join(SITE, "docs", "index.html")) else "docs.html"

# English file -> (English URL, Indonesian file, Indonesian URL)
def pages():
    out = [("index.html", "/", "id/index.html", "/id"), ("features.html", "/features", "id/features.html", "/id/features"),
           ("pricing.html", "/pricing", "id/pricing.html", "/id/pricing"), ("security.html", "/security", "id/security.html", "/id/security"),
           (docs_file(), "/docs", "id/docs.html", "/id/docs"), ("about.html", "/about", "id/about.html", "/id/about"),
           ("contact.html", "/contact", "id/contact.html", "/id/contact"), ("blog.html", "/blog", "id/blog.html", "/id/blog")]
    for f in sorted(os.listdir(os.path.join(SITE, "blog"))):
        if f.endswith(".html"):
            s = f[:-5]; out.append((f"blog/{s}.html", f"/blog/{s}", f"id/blog/{s}.html", f"/id/blog/{s}"))
    return out

EN_ONLY = [("privacy.html", "/privacy"), ("terms.html", "/terms")]
LOCAL = r"(?:features|pricing|security|docs|about|contact|blog)(?:/[a-z0-9-]+)?"

def norm(s): return " ".join(s.split())

def split_scripts(html):
    """Yield (is_code, chunk): <script> and <style> bodies are code, the rest is markup."""
    pos = 0
    for m in re.finditer(r"(<(script|style)\b[^>]*>)(.*?)(</\2>)", html, re.S):
        yield False, html[pos:m.end(1)]
        yield True, m.group(3)
        pos = m.start(4)
    yield False, html[pos:]

ATTR = re.compile(r'(\s(?:aria-label|alt|title|placeholder|content)=")([^"]*)(")')
NODE = re.compile(r">([^<>]+)<")
SKIP_BLOCK = re.compile(r"(<(code|pre)\b[^>]*>.*?</\2>)", re.S)

def tr_markup(chunk, missing):
    def node(m):
        raw = m.group(1); key = norm(raw)
        if not key: return m.group(0)
        if key in TEXT:
            lead = raw[:len(raw) - len(raw.lstrip())]; trail = raw[len(raw.rstrip()):]
            return ">" + lead + TEXT[key] + trail + "<"
        if re.search(r"[A-Za-z]{3}", key): missing.add(key)
        return m.group(0)
    def attr(m):
        key = norm(m.group(2))
        if key not in TEXT and re.search(r"[A-Za-z]{3} [A-Za-z]", key) and "width=" not in key: missing.add("@" + key)
        return m.group(1) + TEXT.get(key, m.group(2)) + m.group(3) if key in TEXT else m.group(0)
    parts = SKIP_BLOCK.split(chunk)
    out = []
    i = 0
    while i < len(parts):
        if i % 3 == 0:
            out.append(ATTR.sub(attr, NODE.sub(node, parts[i])))
        else:
            out.append(parts[i])  # code/pre block kept as is
            i += 1                # skip the tag-name group
        i += 1
    return "".join(out)

def tr_js(code):
    for a, b in JS: code = code.replace(a, b)
    return code

def local_links(html):
    """Links to translated pages go to their Indonesian pair; Privacy, Terms, the app and assets stay."""
    def rep(m):
        p, h = m.group(1) or "", m.group(2) or ""
        return 'href="/id' + ("/" + p if p else "") + h + '"'
    return re.sub(r'href="/(' + LOCAL + r')?(#[^"]*)?"', rep, html)

def heads(html, en_url, id_url):
    alt = (f'<link rel="alternate" hreflang="en" href="https://konteks.io{en_url}">'
           f'<link rel="alternate" hreflang="id" href="https://konteks.io{id_url}">'
           f'<link rel="alternate" hreflang="x-default" href="https://konteks.io{en_url}">')
    return html.replace('<meta name="viewport"', alt + '\n<meta name="viewport"', 1)

def to_id(html, en_url, id_url):
    missing = set()
    html = "".join(tr_js(c) if code else tr_markup(c, missing) for code, c in split_scripts(html))
    html = html.replace('<html lang="en"', '<html lang="id"', 1)
    html = local_links(html)
    # the language switch now offers English
    html = html.replace('hreflang="id" lang="id" aria-label="Baca dalam bahasa Indonesia">ID<', 'hreflang="en" lang="en" aria-label="Read in English">EN<')
    html = html.replace('hreflang="id" lang="id"><svg class="ico"><use href="#i-globe"/></svg><span>Bahasa Indonesia<', 'hreflang="en" lang="en"><svg class="ico"><use href="#i-globe"/></svg><span>English<')
    html = html.replace("@@ALT@@", en_url)
    return heads(html, en_url, id_url), missing

KEEP = set()  # English left on purpose is listed in i18n_id.json as text: same -> same

def main():
    report = {}
    for en_f, en_url, id_f, id_url in pages():
        src = open(os.path.join(SITE, en_f), encoding="utf-8").read()
        out, missing = to_id(src, en_url, id_url)
        os.makedirs(os.path.dirname(os.path.join(SITE, id_f)), exist_ok=True)
        open(os.path.join(SITE, id_f), "w", encoding="utf-8").write(out)
        open(os.path.join(SITE, en_f), "w", encoding="utf-8").write(heads(src.replace("@@ALT@@", id_url), en_url, id_url))
        if missing: report[id_f] = sorted(missing)
    for en_f, en_url in EN_ONLY:
        p = os.path.join(SITE, en_f); s = open(p, encoding="utf-8").read()
        open(p, "w", encoding="utf-8").write(s.replace("@@ALT@@", "/id"))
    # the house: two hand-lettered words on the board
    art = os.path.join(SITE, "art", "house.svg")
    if os.path.exists(art):
        s = open(art, encoding="utf-8").read()
        open(os.path.join(SITE, "art", "house.id.svg"), "w", encoding="utf-8").write(s.replace(">Explore<", ">Jelajah<").replace(">Decide<", ">Pilih<"))
    for f, ms in report.items():
        print(f"i18n: {f} has {len(ms)} untranslated: " + " | ".join(m[:60] for m in ms[:12]))
    print("i18n: built", len(pages()), "Indonesian pages")

if __name__ == "__main__":
    main()
