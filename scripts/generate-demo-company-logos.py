from __future__ import annotations

import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "backend" / "storage" / "company"
SIZE = 512
SCALE = 2


COMPANIES = [
    ("VinaFin Tech", "Fintech", "#b51d1a", "#111827"),
    ("Lotus Commerce", "E-commerce", "#dc2626", "#0f766e"),
    ("Mekong Digital Solutions", "Outsourcing", "#be123c", "#1e293b"),
    ("Saigon Product Studio", "Product", "#991b1b", "#334155"),
    ("CloudNova Vietnam", "Cloud", "#2563eb", "#0f172a"),
    ("EduSpark Labs", "Edtech", "#ea580c", "#1e293b"),
    ("PixelForge Games", "Game", "#7c3aed", "#111827"),
    ("DataBridge Analytics", "AI/Data", "#0f766e", "#0f172a"),
    ("GreenLogistics AI", "AI/Data", "#16a34a", "#14532d"),
    ("NextPay Systems", "Fintech", "#b91c1c", "#1f2937"),
    ("Bao Minh Software", "Enterprise Software", "#1d4ed8", "#111827"),
    ("Orion Outsourcing", "Outsourcing", "#c2410c", "#1f2937"),
    ("VietHealth Tech", "Healthtech", "#059669", "#064e3b"),
    ("SmartFactory Hub", "Industry 4.0", "#475569", "#0f172a"),
    ("Nova Retail Platform", "E-commerce", "#db2777", "#111827"),
    ("Sunbyte Security", "Cybersecurity", "#f59e0b", "#111827"),
    ("Riverbank Banking Tech", "Fintech", "#0f766e", "#0f172a"),
    ("Delta Mobility", "Mobility", "#2563eb", "#172554"),
    ("AlphaAI Research Vietnam", "AI/Data", "#9333ea", "#111827"),
    ("Hikari Global Services", "Outsourcing", "#dc2626", "#1f2937"),
    ("TeraOps Cloud", "Cloud", "#0284c7", "#0f172a"),
    ("Zenith ERP Vietnam", "Enterprise Software", "#4f46e5", "#111827"),
    ("InsightX Consulting", "Consulting", "#0f766e", "#1f2937"),
    ("HomeLink Property Tech", "Proptech", "#b45309", "#111827"),
]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def initials(name: str) -> str:
    words = [word for word in re.split(r"[^A-Za-z0-9]+", name) if word]
    if not words:
        return "JH"
    if len(words) == 1:
        return words[0][:2].upper()
    return f"{words[0][0]}{words[1][0]}".upper()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def blend(a: tuple[int, int, int], b: tuple[int, int, int], amount: float) -> tuple[int, int, int]:
    return tuple(round(a[i] * (1 - amount) + b[i] * amount) for i in range(3))


def wrap_text(draw: ImageDraw.ImageDraw, text: str, typeface: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=typeface)[2] <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines[:2]


def draw_logo(name: str, sector: str, primary_hex: str, ink_hex: str) -> Image.Image:
    size = SIZE * SCALE
    image = Image.new("RGB", (size, size), "#ffffff")
    draw = ImageDraw.Draw(image)
    primary = hex_to_rgb(primary_hex)
    ink = hex_to_rgb(ink_hex)
    pale = blend(primary, (255, 255, 255), 0.88)
    pale_2 = blend(primary, (255, 255, 255), 0.75)

    for y in range(size):
        t = y / size
        color = blend((255, 255, 255), pale, t * 0.95)
        draw.line((0, y, size, y), fill=color)

    margin = 44 * SCALE
    radius = 54 * SCALE
    draw.rounded_rectangle((margin, margin, size - margin, size - margin), radius=radius, fill="#ffffff", outline=blend(primary, (255, 255, 255), 0.62), width=3 * SCALE)

    # Decorative system grid and signal path.
    for idx in range(5):
        x = (92 + idx * 78) * SCALE
        draw.line((x, 108 * SCALE, x, 196 * SCALE), fill=pale, width=2 * SCALE)
        draw.ellipse((x - 8 * SCALE, 102 * SCALE, x + 8 * SCALE, 118 * SCALE), fill=pale_2)
    points = [
        (116 * SCALE, 232 * SCALE),
        (188 * SCALE, 190 * SCALE),
        (262 * SCALE, 224 * SCALE),
        (350 * SCALE, 154 * SCALE),
        (412 * SCALE, 178 * SCALE),
    ]
    draw.line(points, fill=primary, width=8 * SCALE, joint="curve")
    for x, y in points:
        draw.ellipse((x - 12 * SCALE, y - 12 * SCALE, x + 12 * SCALE, y + 12 * SCALE), fill="#ffffff", outline=primary, width=5 * SCALE)

    monogram = initials(name)
    mono_font = font(96 * SCALE, bold=True)
    bbox = draw.textbbox((0, 0), monogram, font=mono_font)
    circle = (132 * SCALE, 178 * SCALE, 380 * SCALE, 426 * SCALE)
    draw.ellipse(circle, fill=ink)
    draw.arc((124 * SCALE, 170 * SCALE, 388 * SCALE, 434 * SCALE), start=28, end=165, fill=primary, width=18 * SCALE)
    draw.text(((size - (bbox[2] - bbox[0])) / 2, 232 * SCALE), monogram, font=mono_font, fill="#ffffff")

    sector_font = font(19 * SCALE, bold=True)
    pill_text = sector.upper()
    pill_bbox = draw.textbbox((0, 0), pill_text, font=sector_font)
    pill_w = pill_bbox[2] + 34 * SCALE
    pill_h = 34 * SCALE
    pill_x = (size - pill_w) / 2
    pill_y = 448 * SCALE
    draw.rounded_rectangle((pill_x, pill_y, pill_x + pill_w, pill_y + pill_h), radius=17 * SCALE, fill=blend(primary, (255, 255, 255), 0.86))
    draw.text((pill_x + 17 * SCALE, pill_y + 5 * SCALE), pill_text, font=sector_font, fill=primary)

    # Small Jobhunter quality mark.
    draw.rounded_rectangle((382 * SCALE, 74 * SCALE, 438 * SCALE, 130 * SCALE), radius=14 * SCALE, fill="#111827")
    draw.arc((394 * SCALE, 84 * SCALE, 428 * SCALE, 118 * SCALE), start=28, end=325, fill="#ffffff", width=5 * SCALE)
    draw.line((422 * SCALE, 112 * SCALE, 438 * SCALE, 128 * SCALE), fill=primary, width=6 * SCALE)

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, sector, primary, ink in COMPANIES:
        draw_logo(name, sector, primary, ink).save(OUT_DIR / f"jobhunter-company-{slugify(name)}.png", optimize=True)
    print(f"Generated {len(COMPANIES)} company logos in {OUT_DIR}")


if __name__ == "__main__":
    main()
