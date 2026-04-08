import os
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: pdf_to_png.py <input_pdf> <output_dir>", file=sys.stderr)
        return 2

    input_pdf = sys.argv[1]
    output_dir = sys.argv[2]

    os.makedirs(output_dir, exist_ok=True)

    try:
        import fitz  # PyMuPDF
    except Exception as exc:  # pragma: no cover
        print(f"missing dependency pymupdf: {exc}", file=sys.stderr)
        return 3

    doc = fitz.open(input_pdf)
    try:
        for i, page in enumerate(doc, start=1):
            pix = page.get_pixmap(dpi=180, alpha=False)
            out_path = os.path.join(output_dir, f"page-{i:03d}.png")
            pix.save(out_path)
    finally:
        doc.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
