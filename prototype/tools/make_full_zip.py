"""Builds the full developer package: code, reference documents and the prototype, laid out as AGENTS.md refers to them."""
import sys, os, zipfile, pathlib
P = pathlib.Path(__file__).resolve().parent.parent          # prototype/
R = P.parent                                                # repo root
out = pathlib.Path(sys.argv[1])
site_index = R / "site" / "index.html"
entries = []
for f in sorted((P / "code").iterdir()):
    if f.is_file(): entries.append((f, f.name))
entries += [(R / "DESIGN.md", "DESIGN.md"), (R / "PRODUCT.md", "PRODUCT.md"), (R / "AUDIT-STATUS.md", "AUDIT-STATUS.md"),
            (R / "docs" / "LIVE_PARITY.md", "parity/LIVE_PARITY.md"),
            (R / "docs" / "konteks-audit-ui-ux.pdf", "docs/konteks-audit-ui-ux.pdf"), (R / "docs" / "audit-ui-ux.md", "docs/audit-ui-ux.md"),
            (R / "docs" / "overlays.md", "docs/overlays.md"),
            (site_index, "prototype/index.html"), (P / "build.sh", "prototype/build.sh")]
for d in ("src", "tools"):
    for f in sorted((P / d).rglob("*")):
        if f.is_file() and "__pycache__" not in f.parts: entries.append((f, f"prototype/{d}/{f.relative_to(P / d)}"))
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for src, name in entries: z.write(src, "konteks-ui/" + name)
print(out, len(entries), "files", round(out.stat().st_size / 1024), "KB")
