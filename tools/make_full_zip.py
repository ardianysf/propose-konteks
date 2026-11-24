"""Builds the full developer package: code, reference documents and the prototype, laid out as AGENTS.md refers to them."""
import sys, os, zipfile, pathlib
R = pathlib.Path(__file__).resolve().parent.parent          # repo root
PKG = R / "components" / "package"
out = pathlib.Path(sys.argv[1])
site_index = R / ".build" / "prototype.html"
entries = []
for f in sorted(PKG.rglob("*")):
    if f.is_file(): entries.append((f, str(f.relative_to(PKG))))
entries += [(R / "DESIGN.md", "DESIGN.md"), (R / "PRODUCT.md", "PRODUCT.md"), (R / "AUDIT-STATUS.md", "AUDIT-STATUS.md"),
            (R / "docs" / "LIVE_PARITY.md", "parity/LIVE_PARITY.md"),
            (R / "docs" / "konteks-audit-ui-ux.pdf", "docs/konteks-audit-ui-ux.pdf"), (R / "docs" / "audit-ui-ux.md", "docs/audit-ui-ux.md"),
            (R / "docs" / "overlays.md", "docs/overlays.md"),
            (site_index, "prototype/index.html"), (R / "tools" / "build_prototype.sh", "prototype/build.sh")]
# The prototype source, grouped by part as in the repo (see REPO-MAP.md).
for d in ("components/tokens", "components/css", "components/js", "app", "design-system", "tools"):
    for f in sorted((R / d).rglob("*")):
        if f.is_file() and "__pycache__" not in f.parts: entries.append((f, f"prototype/{f.relative_to(R)}"))
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for src, name in entries: z.write(src, "konteks-ui/" + name)
print(out, len(entries), "files", round(out.stat().st_size / 1024), "KB")
