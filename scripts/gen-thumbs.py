"""Gera miniaturas leves para cards/galeria (Hostinger)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "fotos_bolos"
OUT = SRC / "_thumbs"
MAX_W = 480
QUALITY = 72

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    saved = 0
    for path in SRC.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        if "_thumbs" in path.parts:
            continue
        rel = path.relative_to(SRC)
        dest = OUT / rel.with_suffix(".jpg")
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            with Image.open(path) as im:
                im = im.convert("RGB")
                w, h = im.size
                if w > MAX_W:
                    nh = int(h * (MAX_W / w))
                    im = im.resize((MAX_W, nh), Image.Resampling.LANCZOS)
                im.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            count += 1
            saved += dest.stat().st_size
            print(f"ok {rel}")
        except Exception as e:
            print(f"fail {rel}: {e}")
    print(f"done {count} thumbs, {saved/1024/1024:.2f} MB")

if __name__ == "__main__":
    main()
