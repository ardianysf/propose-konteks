"""Builds the developer package (code/) from src/ and embeds the small files for the in-prototype Kode page."""
import re, json, os, shutil, csv, io
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src"); OUT = os.path.join(ROOT, "code")
os.makedirs(OUT, exist_ok=True)
tokens = open(os.path.join(SRC, "tokens.css")).read()

def block(sel_re):
    m = re.search(sel_re + r"\{(.*?)\}", tokens, re.S)
    return dict(re.findall(r"--([\w-]+):([^;]+);", m.group(1)))
light = block(r":root")
dark = block(r':root\[data-theme="dark"\]')
def full(d): o = dict(light); o.update(d); return o
L, D = light, full(dark)
def trip(h):
    h = h.strip().lstrip("#"); h = "".join(c * 2 for c in h) if len(h) == 3 else h
    return f"{int(h[0:2],16)} {int(h[2:4],16)} {int(h[4:6],16)}"

KX = [("kx-canvas","bg"),("kx-raised","surface"),("kx-sidebar-bg","sidebar"),("kx-primary","ink"),("kx-secondary","ink-2"),("kx-muted","ink-3"),
      ("kx-muted-text-aa","ink-3"),("kx-accent-text-aa","accent-ink"),("kx-accent-solid-aa","accent"),("kx-accent-solid-ink","on-accent"),("kx-accent-fill-ink","ink"),
      ("kx-border","line"),("kx-pale","accent-soft"),("kx-accent","accent-fill"),("kx-accent-strong","accent-strong"),("kx-attention","warn"),("kx-danger","danger"),
      ("kx-bubble-bg","accent-tint"),("kx-bubble-border","line-strong"),("kx-tech-code-bg","sunken"),("kx-tech-code-border","line"),
      ("kx-second","info"),("kx-second-text-aa","info"),("kx-second-solid-aa","info"),("kx-second-pale","info-soft")]
APP = [("color-app-bg","bg"),("color-app-card","surface"),("color-app-text","ink"),("color-app-text-secondary","ink-2"),("color-app-text-tertiary","ink-3"),
       ("color-app-border","line"),("color-app-border-strong","line-strong"),("color-app-border-input","line-input"),("color-app-accent-soft","accent-soft"),("color-app-accent","accent-tint"),
       ("color-app-accent-fill","accent-fill"),("color-app-accent-strong","accent-strong"),("color-app-accent-solid","accent"),("color-app-accent-text","accent-ink"),
       ("color-app-success","accent-strong"),("color-app-warning","warn"),("color-app-danger","danger"),("color-app-second","info"),("color-app-second-soft","info-soft"),
       ("app-attention-surface","warn-soft")]
def mapblock(T):
    lines = [f"  --{a}: var(--{b});" for a, b in KX]
    lines += ["  --kx-radius-main: var(--r10);", "  --kx-second-border: color-mix(in srgb, var(--info) 30%, var(--line));", "  --kx-ink-rgb: " + trip(T["ink"]) + ";"]
    lines += [f"  --{a}: {trip(T[b])}; /* {b} {T[b]} */" for a, b in APP]
    return "\n".join(lines)
livemap = f"""/* Drop-in bridge for the live app (Backstage + Tailwind `app-*` classes).
   Load after tokens.css. Every variable the app already reads (--kx-*, --color-app-* as RGB triplets) now takes the
   redesign value, so existing components pick up the new palette, radius and borders without a rewrite.
   Generated from tokens.css by tools/make_package.py. Do not edit by hand. */
:root {{
{mapblock(L)}
}}
.dark, :root[data-theme="dark"] {{
{mapblock(D)}
}}
"""
preset = """/* Tailwind preset for the redesign. Keeps the `app-*` colour names the live app already uses, and collapses the
   type and radius scales so old classes land on the new steps (DS-01, DS-02).
   Usage: module.exports = { presets: [require("./tailwind.preset.js")], ... } */
const rgb = v => `rgb(var(--${v}) / <alpha-value>)`;
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: {
          bg: rgb("color-app-bg"), card: rgb("color-app-card"),
          text: { DEFAULT: rgb("color-app-text"), secondary: rgb("color-app-text-secondary"), tertiary: rgb("color-app-text-tertiary") },
          border: { DEFAULT: rgb("color-app-border"), strong: rgb("color-app-border-strong"), input: rgb("color-app-border-input") },
          accent: { DEFAULT: rgb("color-app-accent"), soft: rgb("color-app-accent-soft"), fill: rgb("color-app-accent-fill"),
            strong: rgb("color-app-accent-strong"), solid: rgb("color-app-accent-solid"), text: rgb("color-app-accent-text") },
          success: rgb("color-app-success"), warning: rgb("color-app-warning"), danger: rgb("color-app-danger"),
          second: { DEFAULT: rgb("color-app-second"), soft: rgb("color-app-second-soft") },
          attention: rgb("app-attention-surface"),
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      /* Seven sizes. 10, 15 and 18 px no longer exist; old classes fall onto the nearest step. */
      fontSize: {
        "2xs": ["12px", "16px"], xs: ["12px", "18px"], sm: ["13px", "20px"], base: ["14px", "21px"],
        md: ["16px", "24px"], lg: ["16px", "24px"], xl: ["20px", "26px"], "2xl": ["20px", "26px"], "3xl": ["28px", "34px"],
      },
      /* Three radii by size, plus full for avatars, dots and the switch track. */
      borderRadius: { sm: "4px", DEFAULT: "6px", md: "6px", lg: "10px", xl: "10px", "2xl": "10px", "3xl": "10px", full: "9999px" },
      boxShadow: { sm: "var(--shadow-1)", DEFAULT: "var(--shadow-1)", md: "var(--shadow-2)", lg: "var(--shadow-3)", xl: "var(--shadow-3)" },
      transitionTimingFunction: { out: "cubic-bezier(.16,1,.3,1)" },
      accentColor: { DEFAULT: "var(--accent)" },
    },
  },
};
"""
pkg_tokens = re.sub(r"@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme=\"light\"\]\)\{.*?\}\}\n", "", tokens, flags=re.S)
pkg_tokens = pkg_tokens.replace(':root[data-theme="dark"]{', '/* The app sets .dark itself (System / Light / Dark in Settings), so there is no media query here. */\n.dark,:root[data-theme="dark"]{')
open(os.path.join(OUT, "tokens.css"), "w").write(pkg_tokens)
open(os.path.join(OUT, "tokens.live-map.css"), "w").write(livemap)
open(os.path.join(OUT, "tailwind.preset.js"), "w").write(preset)
comp = "/* Konteks redesign components. Needs tokens.css first. Class names are listed in README.md. */\n" + open(os.path.join(SRC, "base.css")).read() + open(os.path.join(SRC, "components.css")).read()
open(os.path.join(OUT, "components.css"), "w").write(comp)

def split_top(css):
    """Split CSS into top-level chunks: (prelude, body) for blocks; comments dropped."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S); out = []; i = 0; n = len(css)
    while i < n:
        j = css.find("{", i)
        if j < 0: break
        pre = css[i:j].strip(); depth = 1; k = j + 1
        while k < n and depth:
            if css[k] == "{": depth += 1
            elif css[k] == "}": depth -= 1
            k += 1
        out.append((pre, css[j + 1:k - 1])); i = k
    return out
def split_sel(sel):
    parts, depth, cur = [], 0, ""
    for ch in sel:
        if ch in "([": depth += 1
        if ch in ")]": depth -= 1
        if ch == "," and depth == 0: parts.append(cur.strip()); cur = ""
        else: cur += ch
    parts.append(cur.strip()); return [p for p in parts if p]
def scope_sel(sel):
    if sel in ("html", "body", ":root"): return [".kx"]
    if sel.startswith("body::") or sel.startswith("html::"): return []
    if sel.startswith("body ") or sel.startswith("body:"): return [".kx" + sel[4:]]
    if sel == "*": return [".kx", ".kx *"]
    return [".kx " + sel]
def scope(css):
    res = []
    for pre, body in split_top(css):
        if pre.startswith("@keyframes"): res.append(pre.replace("@keyframes ", "@keyframes kx-") + "{" + body + "}")
        elif pre.startswith("@media") or pre.startswith("@supports"): res.append(pre + "{\n" + scope(body) + "\n}")
        else:
            sels = list(dict.fromkeys(x for s_ in split_sel(pre) for x in scope_sel(s_)))
            if sels == [".kx"] and body.strip() == "height:100%": continue
            if sels: res.append(",".join(sels) + "{" + body.strip() + "}")
    out = "\n".join(res)
    for kf in set(re.findall(r"@keyframes kx-([\w-]+)", out)):
        out = re.sub(r"(animation(?:-name)?:\s*)" + kf + r"\b", r"\1kx-" + kf, out)
    return out
scoped = """/* Konteks components, scoped under .kx so they can live next to Backstage/MUI without restyling anything else.
   Put class="kx" on the root of each migrated page AND on the element that hosts portals (drawers, dialogs, menus, toasts).
   Needs tokens.css. Generated from components.css by tools/make_package.py. */
""" + scope(open(os.path.join(SRC, "base.css")).read() + open(os.path.join(SRC, "components.css")).read())
open(os.path.join(OUT, "components.scoped.css"), "w").write(scoped)

# token table for the Kode page and README
names = ["bg","surface","sidebar","sunken","line","line-strong","line-input","ink","ink-2","ink-3","accent","accent-strong","accent-fill","accent-soft","accent-tint","accent-ink","on-accent","warn","warn-soft","danger","danger-soft","info","info-soft"]
live_of = {}
for a, b in KX + APP: live_of.setdefault(b, []).append("--" + a)
live_vals = {"bg":"#FAF8EF","surface":"#FFFFFF","sidebar":"#FFFFFF","sunken":"#E9E9DC","line":"#E2E9D5","line-strong":"#D6E0C0","ink":"#243025","ink-2":"#4D644F","ink-3":"#607260",
  "accent":"#4F7044","accent-strong":"#5F8D4E","accent-fill":"#8FBF6A","accent-soft":"#F4F8EE","accent-tint":"#E5ECDA","accent-ink":"#4F7044","on-accent":"#FFFFFF",
  "warn":"#9A6212","warn-soft":"#FCF3E2","danger":"#B3261E","danger-soft":"—","info":"#2F6F8F","info-soft":"#E8F1F5"}
rows = [[n, L[n].strip(), D[n].strip(), ", ".join(live_of.get(n, [])) or "—", live_vals.get(n, "—")] for n in names]
# inventory CSV
inv_js = open(os.path.join(SRC, "inventory.js")).read()
buf = io.StringIO(); w = csv.writer(buf); w.writerow(["element", "where", "components", "source", "status", "note", "demo"])
for m in re.finditer(r'^\s*\[(.*)\],?\s*$', inv_js.split("const INVENTORY = [")[1], re.M):
    try:
        row = json.loads("[" + m.group(1) + "]")
        w.writerow([row[0], row[1], " ".join(row[2]) if isinstance(row[2], list) else row[2], row[3], row[4] or "covered", row[5], row[6]])
    except Exception: pass
open(os.path.join(OUT, "inventory.csv"), "w").write(buf.getvalue())
json.dump({"rows": rows}, open(os.path.join(ROOT, "tools", "tokenrows.json"), "w"))
emb = {"components.scoped.css": open(os.path.join(OUT, "components.scoped.css")).read() if os.path.exists(os.path.join(OUT, "components.scoped.css")) else "", "tokens.css": pkg_tokens, "tokens.live-map.css": livemap, "tailwind.preset.js": preset, "README.md": open(os.path.join(OUT, "README.md")).read() if os.path.exists(os.path.join(OUT, "README.md")) else "", "AGENTS.md": open(os.path.join(OUT, "AGENTS.md")).read() if os.path.exists(os.path.join(OUT, "AGENTS.md")) else "", ".stylelintrc.json": open(os.path.join(OUT, ".stylelintrc.json")).read() if os.path.exists(os.path.join(OUT, ".stylelintrc.json")) else ""}
open(os.path.join(SRC, "code-files.js"), "w").write("/* Generated by tools/make_package.py */\nconst CODE_FILES = " + json.dumps(emb) + ";\nconst TOKEN_ROWS = " + json.dumps(rows) + ";\n")
# React + Tailwind components: copied into code/react and embedded for the Kode and Komponen pages.
RSRC = os.path.join(ROOT, "react")
react = {}
if os.path.isdir(RSRC):
    ROUT = os.path.join(OUT, "react"); os.makedirs(ROUT, exist_ok=True)
    for name in ["README.md", "package.json"] + sorted(os.listdir(os.path.join(RSRC, "src"))):
        src = os.path.join(RSRC, name) if name in ("README.md", "package.json") else os.path.join(RSRC, "src", name)
        txt = open(src).read(); react[name] = txt
        open(os.path.join(ROUT, name), "w").write(txt)
with open(os.path.join(SRC, "code-files.js"), "a") as f:
    f.write("const REACT_FILES = " + json.dumps(react) + ";\n")
print("package ok", len(rows))
