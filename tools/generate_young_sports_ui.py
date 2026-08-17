from __future__ import annotations

import colorsys
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(r"D:\篮球")
PROJECT = ROOT / "篮球CocosProject"
OUT = ROOT / "新设计"
QUALITY_OUT = OUT / "品质素材_9档"
SCREEN_ASSET_OUT = OUT / "招募概率_替换素材"
QA_OUT = OUT / "_qa"

AI_BACKGROUND = Path(
    r"C:\Users\ctwl\.codex\generated_images\019fbc4e-2a82-75c0-9dd2-b3e6f873d52f"
    r"\exec-a8fa3d1e-4082-403d-ba17-1b26877149e5.png"
)
AI_FRAME = Path(
    r"C:\Users\ctwl\.codex\generated_images\019fbc4e-2a82-75c0-9dd2-b3e6f873d52f"
    r"\exec-9cc4d79a-7bba-42c5-851f-a9b76fb47902.png"
)

FONT_PIXEL = PROJECT / "assets" / "resources" / "fonts" / "zpix.ttf"
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
HOME_SCREEN = PROJECT / "assets" / "resources" / "images" / "原型图" / "主页.png"
SCOUT_ICON = PROJECT / "assets" / "resources" / "images" / "UI" / "管理层" / "球探.webp"


# Visual index mapping is fixed by RosterSlotView.ts.
TIERS = [
    (0, "概念神", (218, 255, 38), (42, 225, 255), (250, 253, 255), (25, 39, 92)),
    (1, "新秀_饮水机", (58, 214, 126), (179, 255, 70), (240, 255, 247), (14, 70, 66)),
    (2, "轮换_第六人", (44, 178, 255), (69, 245, 224), (240, 251, 255), (17, 69, 119)),
    (3, "首发_核心", (87, 92, 255), (192, 79, 255), (247, 245, 255), (36, 42, 121)),
    (4, "全明星_最佳阵容", (255, 138, 38), (255, 211, 48), (255, 249, 234), (114, 50, 15)),
    (5, "MVP_FMVP", (255, 62, 100), (255, 71, 196), (255, 240, 245), (113, 20, 50)),
    (6, "名人堂", (255, 83, 182), (255, 177, 224), (255, 241, 250), (104, 22, 86)),
    (7, "传奇", (255, 190, 31), (255, 78, 48), (255, 249, 225), (92, 39, 12)),
    (8, "GOAT", (255, 205, 48), (36, 225, 255), (255, 250, 220), (18, 20, 27)),
]


def ensure_dirs() -> None:
    for p in (OUT, QUALITY_OUT, SCREEN_ASSET_OUT, QA_OUT):
        p.mkdir(parents=True, exist_ok=True)
    for index, name, *_ in TIERS:
        (QUALITY_OUT / f"{index:02d}_{name}").mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    # The approved visual master uses a hard-edged pixel font for every weight.
    # Bold hierarchy is supplied by scale and outline, not a smooth system font.
    return ImageFont.truetype(str(FONT_PIXEL), size=size)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(round(x * (1 - t) + y * t) for x, y in zip(a, b))


def cut_poly(box: tuple[int, int, int, int], cut: int) -> list[tuple[int, int]]:
    x0, y0, x1, y1 = box
    return [
        (x0 + cut, y0), (x1 - cut, y0), (x1, y0 + cut),
        (x1, y1 - cut), (x1 - cut, y1), (x0 + cut, y1),
        (x0, y1 - cut), (x0, y0 + cut),
    ]


def draw_poly_outline(draw: ImageDraw.ImageDraw, points, color, width: int) -> None:
    for offset in range(width):
        shifted = [(x, y + offset) for x, y in points]
        draw.line(shifted + [shifted[0]], fill=color, width=1, joint="curve")


def chroma_key_frame(source: Path) -> Image.Image:
    img = Image.open(source).convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, _ = px[x, y]
            green_score = g - max(r, b)
            if g > 125 and green_score > 42:
                alpha = max(0, min(255, 255 - int((green_score - 42) * 4.8)))
                if green_score > 88:
                    alpha = 0
                px[x, y] = (r, g, b, alpha)
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError("GOAT frame chroma key produced an empty image")
    return img.crop(bbox)


def recolor_frame(base: Image.Image, primary, secondary, index: int) -> Image.Image:
    if index == 8:
        return base.copy()
    img = base.copy().convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if v < 0.24:
                target = mix((8, 13, 28), primary, v * 0.55)
            elif (0.45 < h < 0.58) or (0.78 < h < 0.94):
                target = mix((15, 19, 38), secondary, min(1, v * 0.95))
            else:
                target = mix((14, 20, 39), primary, min(1, 0.25 + v * 0.78))
            if v > 0.82:
                target = mix(target, (255, 255, 255), (v - 0.82) * 2.2)
            px[x, y] = (*target, a)
    return img


def fit_alpha(img: Image.Image, size: tuple[int, int], pad: int = 0) -> Image.Image:
    target = Image.new("RGBA", size, (0, 0, 0, 0))
    max_w, max_h = size[0] - pad * 2, size[1] - pad * 2
    scale = min(max_w / img.width, max_h / img.height)
    resized = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
    target.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return target


def make_recruit_background(index: int, primary, secondary, light, dark) -> Image.Image:
    if index == 8:
        src = Image.open(AI_BACKGROUND).convert("RGB").resize((150, 150), Image.Resampling.LANCZOS)
        return src.resize((300, 300), Image.Resampling.NEAREST).convert("RGBA")
    w = h = 300
    img = Image.new("RGBA", (w, h), (*dark, 255))
    p = img.load()
    center = (150, 118)
    for y in range(h):
        for x in range(w):
            dx, dy = x - center[0], y - center[1]
            radius = math.sqrt(dx * dx + dy * dy) / 208
            glow = max(0.0, 1.0 - radius)
            ray = (math.sin(math.atan2(dy, dx) * 16 + index * 0.7) + 1) * 0.5
            t = min(1.0, glow * (0.64 + ray * 0.20))
            c = mix(dark, primary, t)
            if index == 0:
                c = mix(c, light, max(0, glow - 0.33) * 0.9)
            p[x, y] = (*c, 255)
    d = ImageDraw.Draw(img, "RGBA")
    for r in (46, 72, 98):
        d.ellipse((center[0]-r, center[1]-r, center[0]+r, center[1]+r), outline=(*secondary, 145), width=3)
    for a in range(0, 360, 22):
        rad = math.radians(a + index * 3)
        x1 = center[0] + math.cos(rad) * 42
        y1 = center[1] + math.sin(rad) * 42
        x2 = center[0] + math.cos(rad) * 190
        y2 = center[1] + math.sin(rad) * 190
        d.line((x1, y1, x2, y2), fill=(*secondary, 90), width=2)
    # Street-sport angular floor plates.
    d.polygon([(0, 230), (72, 166), (135, 270), (85, 300), (0, 300)], fill=(*mix(dark, primary, .32), 255))
    d.polygon([(300, 216), (245, 163), (170, 270), (225, 300), (300, 300)], fill=(*mix(dark, secondary, .30), 255))
    for y in range(0, 300, 8):
        for x in range((y // 8) % 2 * 4, 300, 8):
            if (x * 7 + y * 3 + index) % 29 == 0:
                d.rectangle((x, y, x + 3, y + 3), fill=(*light, 95))
    return img


def make_round_frame(primary, secondary, light, dark, index: int) -> Image.Image:
    img = Image.new("RGBA", (200, 202), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    box = (11, 12, 189, 190)
    d.ellipse(box, outline=(5, 12, 25, 245), width=17)
    colors = [primary, secondary, light, primary]
    for i, start in enumerate((4, 94, 184, 274)):
        d.arc(box, start=start, end=start + 80, fill=(*colors[i], 255), width=12)
    d.arc((18, 19, 182, 183), start=0, end=359, fill=(*mix(primary, (255,255,255), .48), 230), width=3)
    for cx, cy in ((26, 28), (174, 28), (26, 174), (174, 174)):
        d.rectangle((cx-4, cy-4, cx+4, cy+4), fill=(*secondary, 255))
    if index in (0, 8):
        d.polygon([(100, 0), (110, 17), (100, 24), (90, 17)], fill=(*light, 255))
    return img


def make_thin_frame(primary, secondary, light, dark, index: int) -> Image.Image:
    img = Image.new("RGBA", (100, 102), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    outer = cut_poly((5, 5, 95, 97), 11)
    inner = cut_poly((11, 11, 89, 91), 8)
    d.polygon(outer, fill=(*dark, 250))
    d.polygon(inner, fill=(0, 0, 0, 0))
    d.line(outer + [outer[0]], fill=(*primary, 255), width=4, joint="curve")
    d.line(inner + [inner[0]], fill=(*light, 235), width=2, joint="curve")
    d.polygon([(5, 25), (5, 10), (20, 5), (34, 5)], fill=(*secondary, 255))
    d.polygon([(95, 77), (95, 92), (80, 97), (66, 97)], fill=(*secondary, 255))
    if index in (0, 8):
        d.rectangle((44, 3, 56, 7), fill=(*secondary, 255))
    return img


def make_nameplate(primary, secondary, light, dark, index: int) -> Image.Image:
    img = Image.new("RGBA", (353, 109), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    shadow = cut_poly((5, 11, 348, 103), 18)
    outer = cut_poly((4, 5, 345, 96), 18)
    inner = cut_poly((13, 14, 336, 87), 12)
    d.polygon(shadow, fill=(3, 9, 24, 125))
    d.polygon(outer, fill=(*primary, 255))
    d.polygon(inner, fill=(*dark, 247))
    d.line(inner + [inner[0]], fill=(*light, 220), width=2)
    d.polygon([(4, 5), (100, 5), (76, 14), (13, 14)], fill=(*secondary, 230))
    d.polygon([(345, 96), (251, 96), (276, 87), (336, 87)], fill=(*secondary, 230))
    for x in range(30, 330, 28):
        d.rectangle((x, 79, x + 8, 82), fill=(*secondary, 125))
    return img


def make_quality_tag(primary, secondary, light, dark, index: int) -> Image.Image:
    img = Image.new("RGBA", (100, 42), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    outer = [(2, 7), (82, 7), (98, 21), (82, 36), (2, 36)]
    inner = [(6, 11), (80, 11), (92, 21), (80, 32), (6, 32)]
    d.polygon(outer, fill=(*primary, 255))
    d.polygon(inner, fill=(*dark, 245))
    d.polygon([(6, 11), (54, 11), (45, 16), (6, 16)], fill=(*secondary, 230))
    # Small abstract rarity spark; no text is baked into the tag.
    cx, cy = 18, 22
    d.polygon([(cx, cy-8), (cx+3, cy-3), (cx+9, cy-2), (cx+4, cy+2),
               (cx+6, cy+8), (cx, cy+5), (cx-6, cy+8), (cx-4, cy+2),
               (cx-9, cy-2), (cx-3, cy-3)], fill=(*light, 255))
    if index in (0, 8):
        d.rectangle((68, 29, 82, 31), fill=(*secondary, 255))
    return img


def make_wheat(primary, secondary, light, dark, index: int) -> Image.Image:
    img = Image.new("RGBA", (87, 217), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.line((71, 205, 35, 22), fill=(*mix(primary, dark, .18), 255), width=5)
    for i in range(9):
        y = 190 - i * 19
        x = 68 - i * 4
        length = 31 - i
        color = mix(primary, secondary if i % 3 == 1 else light, .28 + (i % 3) * .14)
        d.polygon([(x, y), (x-length, y-10), (x-8, y-25), (x+2, y-8)], fill=(*color, 255))
        d.line([(x, y), (x-length+4, y-11)], fill=(*dark, 210), width=2)
    d.polygon([(33, 23), (39, 1), (48, 21), (39, 37)], fill=(*secondary, 255))
    return img


def make_probability_row(primary, secondary, light, dark) -> tuple[Image.Image, Image.Image]:
    base = Image.new("RGBA", (900, 160), (0, 0, 0, 0))
    border = Image.new("RGBA", (900, 160), (0, 0, 0, 0))
    d = ImageDraw.Draw(base, "RGBA")
    b = ImageDraw.Draw(border, "RGBA")
    poly = cut_poly((3, 3, 897, 157), 20)
    d.polygon(poly, fill=(248, 252, 255, 248))
    d.polygon([(3, 23), (3, 137), (162, 157), (197, 3), (23, 3)], fill=(*mix(primary, light, .12), 255))
    d.polygon([(744, 3), (877, 3), (897, 23), (897, 137), (877, 157), (744, 157), (772, 80)], fill=(*mix(primary, (255,255,255), .72), 255))
    d.polygon([(208, 16), (640, 16), (620, 28), (202, 28)], fill=(*secondary, 85))
    for x in range(300, 700, 34):
        d.rectangle((x, 132, x + 10, 136), fill=(*primary, 55))
    b.line(poly + [poly[0]], fill=(*dark, 255), width=9, joint="curve")
    inner = cut_poly((11, 11, 889, 149), 15)
    b.line(inner + [inner[0]], fill=(*primary, 255), width=5, joint="curve")
    b.line([(198, 11), (174, 149)], fill=(*secondary, 210), width=4)
    b.line([(754, 11), (730, 149)], fill=(*secondary, 210), width=4)
    return base, border


def make_screen_assets() -> dict[str, Image.Image]:
    assets: dict[str, Image.Image] = {}
    # Main panel background compatible with the 970x1550 bg node.
    panel = Image.new("RGBA", (970, 1550), (0, 0, 0, 0))
    d = ImageDraw.Draw(panel, "RGBA")
    shadow = cut_poly((8, 18, 962, 1547), 38)
    outer = cut_poly((2, 2, 958, 1528), 40)
    inner = cut_poly((18, 18, 942, 1512), 30)
    d.polygon(shadow, fill=(4, 12, 43, 105))
    d.polygon(outer, fill=(35, 91, 236, 255))
    d.polygon(inner, fill=(244, 249, 255, 252))
    # Youthful street-court paint and angled tape strips.
    d.polygon([(18, 18), (470, 18), (390, 150), (18, 150)], fill=(31, 103, 255, 255))
    d.polygon([(942, 18), (735, 18), (680, 150), (942, 150)], fill=(208, 247, 25, 255))
    d.rectangle((18, 150, 942, 166), fill=(15, 36, 95, 255))
    for y in range(206, 1460, 82):
        d.polygon([(25, y), (44, y), (25, y + 28)], fill=(41, 215, 255, 80))
        d.polygon([(945, y+25), (924, y+25), (945, y-5)], fill=(101, 84, 255, 70))
    for x in range(68, 920, 48):
        d.rectangle((x, 1482, x + 14, 1487), fill=(31, 103, 255, 55))
    assets["弹窗底图_970x1550"] = panel

    scout = Image.new("RGBA", (900, 300), (0, 0, 0, 0))
    s = ImageDraw.Draw(scout, "RGBA")
    poly = cut_poly((3, 3, 897, 297), 24)
    s.polygon(poly, fill=(230, 247, 255, 252))
    s.polygon([(3, 27), (3, 273), (246, 297), (208, 3), (27, 3)], fill=(47, 215, 255, 75))
    s.polygon([(690, 3), (873, 3), (897, 27), (897, 273), (873, 297), (760, 297)], fill=(212, 247, 24, 75))
    s.line(poly + [poly[0]], fill=(14, 41, 110, 255), width=8, joint="curve")
    s.line(cut_poly((12, 12, 888, 288), 18) + [cut_poly((12, 12, 888, 288), 18)[0]], fill=(44, 178, 255, 255), width=4)
    s.line((408, 54, 842, 54), fill=(56, 116, 238, 100), width=4)
    s.line((408, 205, 842, 205), fill=(56, 116, 238, 100), width=4)
    assets["球探加成底图_900x300"] = scout

    button = Image.new("RGBA", (900, 130), (0, 0, 0, 0))
    bd = ImageDraw.Draw(button, "RGBA")
    poly = cut_poly((2, 2, 898, 128), 28)
    bd.polygon([(9, 10), (891, 10), (891, 128), (9, 128)], fill=(3, 13, 54, 100))
    bd.polygon(poly, fill=(207, 245, 18, 255))
    inner = cut_poly((12, 12, 888, 118), 20)
    bd.line(inner + [inner[0]], fill=(22, 48, 118, 255), width=6)
    bd.polygon([(2, 28), (92, 2), (164, 2), (77, 128), (2, 128)], fill=(39, 109, 255, 255))
    assets["升级按钮底图_900x130"] = button

    close = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    cd = ImageDraw.Draw(close, "RGBA")
    cd.polygon(cut_poly((3, 3, 117, 117), 22), fill=(20, 56, 154, 255))
    cd.line(cut_poly((10, 10, 110, 110), 16) + [cut_poly((10, 10, 110, 110), 16)[0]], fill=(70, 224, 255, 255), width=5)
    cd.line((38, 38, 82, 82), fill=(255, 255, 255, 255), width=12)
    cd.line((82, 38, 38, 82), fill=(255, 255, 255, 255), width=12)
    assets["关闭按钮底图_120x120"] = close
    return assets


def save_quality_assets() -> dict[int, dict[str, Image.Image]]:
    frame_source = chroma_key_frame(AI_FRAME)
    results: dict[int, dict[str, Image.Image]] = {}
    for index, name, primary, secondary, light, dark in TIERS:
        folder = QUALITY_OUT / f"{index:02d}_{name}"
        frame = fit_alpha(recolor_frame(frame_source, primary, secondary, index), (193, 199), 1)
        recruit_bg = make_recruit_background(index, primary, secondary, light, dark)
        round_frame = make_round_frame(primary, secondary, light, dark, index)
        thin = make_thin_frame(primary, secondary, light, dark, index)
        nameplate = make_nameplate(primary, secondary, light, dark, index)
        tag = make_quality_tag(primary, secondary, light, dark, index)
        wheat = make_wheat(primary, secondary, light, dark, index)
        row_base, row_border = make_probability_row(primary, secondary, light, dark)
        items = {
            f"招募背景0{index}": recruit_bg,
            f"头像框{index}-方": frame,
            f"头像框{index}-圆": round_frame,
            f"品质标签0{index}": tag,
            f"名牌0{index}": nameplate,
            f"细边框0{index}": thin,
            f"麦穗0{index}": wheat,
            f"概率行底0{index}_900x160": row_base,
            f"概率行边框0{index}_900x160": row_border,
        }
        for filename, image in items.items():
            image.save(folder / f"{filename}.png")
        results[index] = items
    return results


def paste_center(canvas: Image.Image, img: Image.Image, cx: int, cy: int) -> None:
    canvas.alpha_composite(img, (round(cx - img.width / 2), round(cy - img.height / 2)))


def text_center(draw: ImageDraw.ImageDraw, xy, value: str, fnt, fill, stroke=0, stroke_fill=(0,0,0,255)) -> None:
    draw.text(xy, value, font=fnt, fill=fill, anchor="mm", stroke_width=stroke, stroke_fill=stroke_fill)


def compose_recruit_probability(quality_assets, screen_assets) -> Image.Image:
    base = Image.open(HOME_SCREEN).convert("RGB").resize((1080, 2160), Image.Resampling.LANCZOS)
    base = ImageEnhance.Brightness(base).enhance(1.24)
    base = ImageEnhance.Color(base).enhance(1.28).filter(ImageFilter.GaussianBlur(5))
    screen = base.convert("RGBA")
    overlay = Image.new("RGBA", screen.size, (20, 68, 170, 110))
    screen.alpha_composite(overlay)
    deco = Image.new("RGBA", screen.size, (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco, "RGBA")
    dd.polygon([(0, 0), (780, 0), (0, 760)], fill=(48, 211, 255, 48))
    dd.polygon([(1080, 2160), (310, 2160), (1080, 1460)], fill=(218, 251, 30, 35))
    for y in range(80, 2080, 72):
        dd.rectangle((20, y, 26, y + 24), fill=(255, 255, 255, 55))
        dd.rectangle((1054, y + 24, 1060, y + 48), fill=(255, 255, 255, 45))
    screen.alpha_composite(deco)

    # Prefab coordinates converted from Cocos center-origin space.
    panel = screen_assets["弹窗底图_970x1550"]
    paste_center(screen, panel, 540, 1142)
    draw = ImageDraw.Draw(screen, "RGBA")

    # Header artwork is baked into the panel bg; title remains a Label in-game.
    draw.polygon([(124, 408), (203, 379), (268, 408), (244, 486), (148, 486)], fill=(12, 37, 112, 255))
    draw.line([(148, 486), (124, 408), (203, 379), (268, 408), (244, 486), (148, 486)], fill=(55, 224, 255, 255), width=6)
    try:
        title_scout = Image.open(SCOUT_ICON).convert("RGBA")
        title_scout.thumbnail((86, 86), Image.Resampling.NEAREST)
        paste_center(screen, title_scout, 198, 437)
    except OSError:
        pass
    text_center(draw, (555, 456), "招募概率", font(86, True), (255, 255, 255, 255), 5, (12, 38, 112, 255))
    paste_center(screen, screen_assets["关闭按钮底图_120x120"], 942, 455)

    rows = [
        (1, "新秀", "49.90%"),
        (1, "饮水机", "27.94%"),
        (2, "轮换", "13.77%"),
        (2, "第六人", "6.49%"),
        (3, "首发", "1.90%"),
    ]
    centers_y = [623, 793, 963, 1133, 1303]
    for (qidx, qname, probability), cy in zip(rows, centers_y):
        paste_center(screen, quality_assets[qidx][f"概率行底0{qidx}_900x160"], 540, cy)
        paste_center(screen, quality_assets[qidx][f"概率行边框0{qidx}_900x160"], 540, cy)
        primary = TIERS[qidx][2]
        # Runtime Label anchors from prefab: quality x=141, probability x=935.
        text_center(draw, (141, cy), qname, font(48, True), (255,255,255,255), 4, (15,38,92,255))
        text_center(draw, (935, cy), probability, font(45, True), (*primary,255), 3, (255,255,255,255))
        # Small non-text quality spark integrated in the row background area.
        tag = quality_assets[qidx][f"品质标签0{qidx}"].resize((86, 36), Image.Resampling.LANCZOS)
        screen.alpha_composite(tag, (195, cy - 18))

    paste_center(screen, screen_assets["球探加成底图_900x300"], 540, 1562)
    try:
        scout = Image.open(SCOUT_ICON).convert("RGBA")
        scout.thumbnail((118, 118), Image.Resampling.NEAREST)
        paste_center(screen, scout, 303, 1497)
    except OSError:
        pass
    text_center(draw, (600, 1493), "球探 Lv.20", font(60, True), (22, 54, 130, 255))
    text_center(draw, (540, 1616), "最高品质概率  +0.20%", font(50, True), (20, 104, 193, 255))
    draw.polygon([(276, 1660), (695, 1660), (671, 1690), (300, 1690)], fill=(45, 212, 255, 55))

    paste_center(screen, screen_assets["升级按钮底图_900x130"], 540, 1796)
    draw.polygon([(155, 1766), (187, 1796), (155, 1826)], fill=(224, 251, 25, 255))
    text_center(draw, (586, 1796), "立刻升级球探", font(65, True), (12, 39, 104, 255))

    return screen


def make_quality_overview(assets) -> Image.Image:
    cell_w, cell_h = 470, 500
    canvas = Image.new("RGBA", (cell_w * 3, cell_h * 3), (236, 244, 255, 255))
    d = ImageDraw.Draw(canvas, "RGBA")
    for n, (index, name, primary, secondary, light, dark) in enumerate(TIERS):
        ox, oy = (n % 3) * cell_w, (n // 3) * cell_h
        d.rectangle((ox + 10, oy + 10, ox + cell_w - 10, oy + cell_h - 10), fill=(255,255,255,255), outline=(*primary,255), width=5)
        text_center(d, (ox + cell_w//2, oy + 43), f"{index:02d}  {name.replace('_',' / ')}", font(28, True), (*dark,255))
        bg = assets[index][f"招募背景0{index}"].resize((210,210), Image.Resampling.NEAREST)
        canvas.alpha_composite(bg, (ox + 25, oy + 78))
        frame = assets[index][f"头像框{index}-方"].resize((145,150), Image.Resampling.LANCZOS)
        canvas.alpha_composite(frame, (ox + 58, oy + 108))
        canvas.alpha_composite(assets[index][f"名牌0{index}"].resize((205,63),Image.Resampling.LANCZOS),(ox+245,oy+92))
        canvas.alpha_composite(assets[index][f"品质标签0{index}"].resize((150,63),Image.Resampling.LANCZOS),(ox+270,oy+173))
        canvas.alpha_composite(assets[index][f"头像框{index}-圆"].resize((120,121),Image.Resampling.LANCZOS),(ox+270,oy+245))
        canvas.alpha_composite(assets[index][f"细边框0{index}"].resize((100,102),Image.Resampling.LANCZOS),(ox+360,oy+255))
        canvas.alpha_composite(assets[index][f"麦穗0{index}"].resize((65,162),Image.Resampling.LANCZOS),(ox+245,oy+285))
    return canvas


def verify(paths: list[Path]) -> None:
    expected = {
        "名牌": (353, 109), "品质标签": (100, 42), "-方": (193, 199),
        "-圆": (200, 202), "招募背景": (300, 300), "细边框": (100, 102),
        "麦穗": (87, 217), "概率行底": (900, 160), "概率行边框": (900, 160),
    }
    for path in paths:
        with Image.open(path) as im:
            for key, size in expected.items():
                if key in path.stem and im.size != size:
                    raise AssertionError(f"{path}: {im.size} != {size}")
            if path.suffix.lower() == ".png" and im.mode != "RGBA":
                raise AssertionError(f"{path}: expected RGBA, got {im.mode}")
            if any(k in path.stem for k in ("头像框", "品质标签", "名牌", "细边框", "麦穗", "概率行边框")):
                alpha = im.getchannel("A")
                if alpha.getextrema()[0] != 0 or alpha.getbbox() is None:
                    raise AssertionError(f"{path}: transparency/non-empty validation failed")


def main() -> None:
    ensure_dirs()
    quality_assets = save_quality_assets()
    screen_assets = make_screen_assets()
    for name, image in screen_assets.items():
        image.save(SCREEN_ASSET_OUT / f"{name}.png")
    prototype = compose_recruit_probability(quality_assets, screen_assets)
    prototype_path = OUT / "招募概率_街球竞技_品质系统_v1.png"
    prototype.save(prototype_path)
    overview = make_quality_overview(quality_assets)
    overview_path = OUT / "品质素材_9档_总览.png"
    overview.save(overview_path)
    all_asset_paths = list(QUALITY_OUT.rglob("*.png")) + list(SCREEN_ASSET_OUT.glob("*.png"))
    verify(all_asset_paths)
    with Image.open(prototype_path) as im:
        if im.size != (1080, 2160):
            raise AssertionError(f"prototype size is {im.size}")
    print(prototype_path)
    print(overview_path)
    print(f"quality assets: {len(list(QUALITY_OUT.rglob('*.png')))}")
    print(f"screen assets: {len(list(SCREEN_ASSET_OUT.glob('*.png')))}")


if __name__ == "__main__":
    main()
