from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"D:\篮球")
BASE = ROOT / r"界面图合集\原型图-新\素材\招募概率弹窗_无字底图.png"
PROJECT_DIR = ROOT / r"篮球CocosProject\assets\resources\images\原型图"
OUTPUT = PROJECT_DIR / "招募概率弹窗.png"
COMPAT_OUTPUT = PROJECT_DIR / "招募权重弹窗.png"
ARCHIVE_OUTPUT = ROOT / r"界面图合集\原型图-新\招募概率弹窗.png"
BACKUP = ROOT / r"备份\原型图\招募权重弹窗_旧版权重_20260730.png"

FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_REGULAR = Path(r"C:\Windows\Fonts\msyh.ttc")
SIZE = (1080, 2160)

CREAM = (246, 226, 183, 255)
GOLD = (245, 168, 25, 255)
TEAL = (61, 200, 185, 255)
DIM = (154, 177, 175, 255)
GREEN = (81, 224, 132, 255)
BLUE = (66, 178, 242, 255)
PURPLE = (209, 104, 244, 255)
BLACK = (2, 7, 9, 255)


def get_font(path: Path, target_size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), max(8, target_size // 2))


def centered(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: int,
    y: int,
    size: int,
    color: tuple[int, int, int, int],
    *,
    regular: bool = False,
    stroke: int = 2,
) -> None:
    font = get_font(FONT_REGULAR if regular else FONT_BOLD, size)
    stroke_half = max(0, stroke // 2)
    box = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_half)
    width = box[2] - box[0]
    draw.text(
        (center_x // 2 - width // 2, y // 2),
        text,
        font=font,
        fill=color,
        stroke_width=stroke_half,
        stroke_fill=BLACK,
    )


def left(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    size: int,
    color: tuple[int, int, int, int],
    *,
    regular: bool = False,
    stroke: int = 2,
) -> None:
    draw.text(
        (x // 2, y // 2),
        text,
        font=get_font(FONT_REGULAR if regular else FONT_BOLD, size),
        fill=color,
        stroke_width=max(0, stroke // 2),
        stroke_fill=BLACK,
    )


def render() -> Image.Image:
    image = Image.open(BASE).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)

    # Render at half resolution, then enlarge with nearest-neighbor to keep
    # the text visually consistent with the game's chunky pixel treatment.
    layer_half = Image.new("RGBA", (540, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer_half)

    centered(draw, "招募概率", 540, 383, 72, CREAM, stroke=6)
    centered(draw, "球探加成：首发 1.70% → 1.90%", 540, 472, 28, TEAL, stroke=2)

    centered(draw, "球队 Lv.20", 275, 608, 26, CREAM, stroke=3)
    centered(draw, "市值 Lv.5", 575, 608, 26, CREAM, stroke=3)
    centered(draw, "球探 Lv.20", 875, 608, 26, CREAM, stroke=3)

    rows = [
        ("新秀", "49.90%", 770, GREEN),
        ("饮水机", "27.94%", 948, GREEN),
        ("轮换", "13.77%", 1127, BLUE),
        ("第六人", "6.49%", 1295, BLUE),
        ("首发", "1.90%", 1466, PURPLE),
    ]
    for quality, probability, y, color in rows:
        left(draw, quality, 225, y, 43, color, stroke=4)
        centered(draw, probability, 892, y - 2, 48, color, stroke=5)

    centered(draw, "最高品质", 689, 1510, 18, BLACK, stroke=0)

    centered(
        draw,
        "以上概率已包含球探加成，合计100%",
        570,
        1616,
        28,
        CREAM,
        regular=True,
        stroke=2,
    )
    centered(
        draw,
        "仅显示当前招募池内的五档品质",
        570,
        1670,
        26,
        DIM,
        regular=True,
        stroke=2,
    )

    centered(draw, "关闭", 540, 1783, 44, (69, 36, 4, 255), stroke=2)

    image.alpha_composite(layer_half.resize(SIZE, Image.Resampling.NEAREST))
    return image.convert("RGB")


def main() -> None:
    PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    if COMPAT_OUTPUT.exists() and not BACKUP.exists():
        BACKUP.write_bytes(COMPAT_OUTPUT.read_bytes())

    image = render()
    image.save(OUTPUT, optimize=True)
    image.save(COMPAT_OUTPUT, optimize=True)
    image.save(ARCHIVE_OUTPUT, optimize=True)
    print(f"wrote: {OUTPUT}")
    print(f"updated: {COMPAT_OUTPUT}")
    print(f"wrote: {ARCHIVE_OUTPUT}")
    print(f"size: {image.size}")


if __name__ == "__main__":
    main()
