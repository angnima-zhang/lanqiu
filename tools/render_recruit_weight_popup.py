from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"D:\篮球")
BASE = ROOT / r"界面图合集\原型图-新\素材\招募权重弹窗_无字底图.png"
OUTPUT_PROJECT = (
    ROOT / r"篮球CocosProject\assets\resources\images\原型图\招募权重弹窗.png"
)
OUTPUT_ARCHIVE = ROOT / r"界面图合集\原型图-新\招募权重弹窗.png"
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_REGULAR = Path(r"C:\Windows\Fonts\msyh.ttc")

TARGET_SIZE = (1080, 2160)

CREAM = (246, 226, 183, 255)
GOLD = (245, 168, 25, 255)
TEAL = (64, 202, 187, 255)
DIM = (144, 168, 166, 255)
GREEN = (86, 224, 134, 255)
BLUE = (67, 177, 242, 255)
PURPLE = (207, 104, 243, 255)
BLACK = (2, 8, 10, 255)
DARK = (4, 24, 30, 255)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), max(8, size // 2))


def center_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: int,
    y: int,
    size: int,
    fill: tuple[int, int, int, int],
    *,
    font_path: Path = FONT_BOLD,
    stroke: int = 2,
    stroke_fill: tuple[int, int, int, int] = BLACK,
) -> None:
    fnt = font(font_path, size)
    x2 = center_x // 2
    y2 = y // 2
    box = draw.textbbox((0, 0), text, font=fnt, stroke_width=max(0, stroke // 2))
    width = box[2] - box[0]
    draw.text(
        (x2 - width // 2, y2),
        text,
        font=fnt,
        fill=fill,
        stroke_width=max(0, stroke // 2),
        stroke_fill=stroke_fill,
    )


def left_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    size: int,
    fill: tuple[int, int, int, int],
    *,
    font_path: Path = FONT_BOLD,
    stroke: int = 2,
    stroke_fill: tuple[int, int, int, int] = BLACK,
) -> None:
    draw.text(
        (x // 2, y // 2),
        text,
        font=font(font_path, size),
        fill=fill,
        stroke_width=max(0, stroke // 2),
        stroke_fill=stroke_fill,
    )


def redraw_table_cells(image: Image.Image) -> None:
    draw = ImageDraw.Draw(image, "RGBA")

    # Header: four clear columns.
    draw.rectangle((59, 722, 1017, 800), fill=(7, 37, 48, 255))
    draw.rectangle((59, 722, 1017, 800), outline=(28, 98, 109, 255), width=4)
    for x in (450, 650, 825):
        draw.line((x, 725, x, 797), fill=(24, 87, 97, 255), width=3)

    rows = [
        (829, 942, GREEN),
        (958, 1070, GREEN),
        (1084, 1200, BLUE),
        (1214, 1330, BLUE),
        (1344, 1465, PURPLE),
    ]
    for y0, y1, accent in rows:
        draw.rectangle((176, y0 + 8, 1006, y1 - 8), fill=DARK)
        for x in (450, 650, 825):
            draw.line((x, y0 + 6, x, y1 - 6), fill=accent, width=3)
    draw.rectangle((205, 1410, 366, 1452), fill=(75, 43, 7, 255))
    draw.rectangle((205, 1410, 366, 1452), outline=GOLD, width=3)


def render() -> Image.Image:
    image = Image.open(BASE).convert("RGBA").resize(
        TARGET_SIZE,
        Image.Resampling.LANCZOS,
    )
    scout_icon = image.crop((714, 548, 814, 665)).resize(
        (38, 44),
        Image.Resampling.LANCZOS,
    )
    redraw_table_cells(image)
    image.alpha_composite(scout_icon, (384, 1408))

    # Text is rendered at half resolution and scaled with nearest-neighbor
    # to preserve the chunky pixel-art appearance.
    text_layer_half = Image.new("RGBA", (540, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer_half)

    center_text(draw, "招募权重详情", 540, 365, 70, CREAM, stroke=6)
    center_text(draw, "当前招募池与球探加成", 540, 448, 30, TEAL, stroke=2)

    center_text(draw, "球队等级", 235, 555, 25, CREAM, stroke=2)
    center_text(draw, "Lv.20", 235, 605, 42, GOLD, stroke=4)
    center_text(draw, "球队市值", 535, 555, 25, CREAM, stroke=2)
    center_text(draw, "Lv.5", 535, 605, 42, GOLD, stroke=4)
    center_text(draw, "球探 Lv.20", 858, 555, 25, CREAM, stroke=2)
    center_text(draw, "最高品质 +0.20", 858, 610, 29, TEAL, stroke=2)

    for label, x in (
        ("品质", 255),
        ("基础权重", 550),
        ("球探加成", 737),
        ("最终权重", 918),
    ):
        center_text(draw, label, x, 745, 24, CREAM, stroke=2)

    rows = [
        ("新秀", "50.00", "+0.00", "50.00", 850, GREEN),
        ("饮水机", "28.00", "+0.00", "28.00", 978, GREEN),
        ("轮换", "13.80", "+0.00", "13.80", 1105, BLUE),
        ("第六人", "6.50", "+0.00", "6.50", 1235, BLUE),
        ("首发", "1.70", "+0.20", "1.90", 1356, PURPLE),
    ]
    for quality, base, bonus, final, y, color in rows:
        left_text(draw, quality, 215, y, 34, color, stroke=4)
        center_text(draw, base, 550, y, 31, CREAM, stroke=3)
        center_text(
            draw,
            bonus,
            737,
            y,
            30,
            GOLD if bonus != "+0.00" else DIM,
            stroke=3,
        )
        center_text(draw, final, 918, y, 34, TEAL, stroke=4)

    center_text(draw, "最高品质", 286, 1418, 18, CREAM, stroke=1)

    left_text(draw, "最终总权重", 245, 1524, 32, CREAM, stroke=3)
    center_text(draw, "100.20", 850, 1515, 48, GOLD, stroke=5)

    left_text(
        draw,
        "权重用于相对抽取，不等于百分比；",
        170,
        1642,
        28,
        CREAM,
        font_path=FONT_REGULAR,
        stroke=2,
    )
    left_text(
        draw,
        "总权重可以超过100。",
        170,
        1700,
        28,
        DIM,
        font_path=FONT_REGULAR,
        stroke=2,
    )

    center_text(draw, "关闭", 540, 1822, 44, (70, 36, 4, 255), stroke=2)

    text_layer = text_layer_half.resize(TARGET_SIZE, Image.Resampling.NEAREST)
    image.alpha_composite(text_layer)
    return image


def main() -> None:
    image = render().convert("RGB")
    OUTPUT_PROJECT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_PROJECT, optimize=True)
    image.save(OUTPUT_ARCHIVE, optimize=True)
    print(f"wrote: {OUTPUT_PROJECT}")
    print(f"wrote: {OUTPUT_ARCHIVE}")
    print(f"size: {image.size}")


if __name__ == "__main__":
    main()
