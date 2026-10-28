"""Colour lint (audit checklist: "no colour outside the tokens").
Fails the build if base.css or components.css contain a raw colour: hex, rgb()/hsl(), or color-mix().
Raw colours live only in tokens.css. Run: python3 tools/lint_colors.py"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent / "src"
RAW = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|color-mix)\(")
bad = []
for name in ["base.css", "components.css"]:
    for n, line in enumerate((ROOT / name).read_text().splitlines(), 1):
        for m in RAW.finditer(line):
            bad.append(f"{name}:{n}: {m.group(0)}  →  use a token from tokens.css")
if bad:
    print("\n".join(bad)); sys.exit(1)
print("colour lint ok")
