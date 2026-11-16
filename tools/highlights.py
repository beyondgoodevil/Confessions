# Lists the highlights saved in a PDF (SumatraPDF: select text, press "a"), with the text under each.
#   python tools/highlights.py "book.pdf"     -> JSON: [{ "page": 12, "text": "…", "note": "…" }, …]   (page = PDF page, from 1)
# Used by tools/sumatra.mjs. Needs PyMuPDF:  python -m pip install pymupdf
import sys, json

try:
    import pymupdf
except Exception:
    print(json.dumps({"error": "PyMuPDF is not installed. Run:  python -m pip install pymupdf"}))
    sys.exit(0)

out = []
try:
    doc = pymupdf.open(sys.argv[1])
except Exception as e:
    print(json.dumps({"error": "Could not open the PDF: %s" % e}))
    sys.exit(0)
for page in doc:
    for a in page.annots() or []:
        if a.type[1] not in ("Highlight", "Underline", "Squiggly"):
            continue
        pts = a.vertices or []
        parts = []
        for i in range(0, len(pts) - 3, 4):               # one quadrilateral per highlighted line
            q = pymupdf.Quad(pts[i:i + 4]).rect
            q = pymupdf.Rect(q.x0, q.y0 + q.height * 0.18, q.x1, q.y1 - q.height * 0.18)   # the middle of the line, so neighbours are not caught
            parts.append(page.get_text("text", clip=q).strip())
        if not pts:
            parts.append(page.get_text("text", clip=a.rect).strip())
        text = " ".join(p for p in parts if p)
        out.append({"page": page.number + 1, "y": round(a.rect.y0, 1), "text": text, "note": (a.info or {}).get("content", "") or ""})
out.sort(key=lambda h: (h["page"], h["y"]))
sys.stdout.reconfigure(encoding="utf-8")
print(json.dumps(out))
