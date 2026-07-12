from pathlib import Path
from PIL import Image, ImageDraw
import math


ROOT = Path.cwd()
OUT = ROOT / "outputs" / "ui_element_sheets_refined"
OUT.mkdir(parents=True, exist_ok=True)

W = 2048
H = 2048
BLACK = (8, 8, 8, 255)
WHITE = (255, 255, 255, 255)
DARK = (24, 38, 48, 255)
PANEL = (45, 68, 82, 255)
PANEL2 = (64, 86, 98, 255)
GOLD = (246, 196, 83, 255)
ORANGE = (242, 140, 40, 255)
RED = (229, 72, 77, 255)
GREEN = (54, 201, 107, 255)
BLUE = (59, 130, 246, 255)
PURPLE = (168, 85, 247, 255)
PINK = (236, 72, 153, 255)
CYAN = (40, 210, 210, 255)
GREY = (174, 184, 190, 255)
LIGHT = (222, 232, 236, 255)
DISABLED = (114, 126, 132, 255)
QUALITY = [GREEN, BLUE, PURPLE, ORANGE, RED, PINK, GOLD]


def canvas():
    return Image.new("RGBA", (W, H), WHITE)


def draw_for(im):
    return ImageDraw.Draw(im)


def rect(draw, xy, fill, outline=BLACK, lw=6):
    draw.rectangle(xy, fill=fill, outline=outline, width=lw)


def roundrect(draw, xy, radius, fill, outline=BLACK, lw=6):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=lw)


def cut_rect(draw, x, y, w, h, cut, fill, outline=BLACK, lw=6):
    pts = [
        (x + cut, y),
        (x + w - cut, y),
        (x + w, y + cut),
        (x + w, y + h - cut),
        (x + w - cut, y + h),
        (x + cut, y + h),
        (x, y + h - cut),
        (x, y + cut),
    ]
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=outline, width=lw, joint="curve")


def diamond(draw, cx, cy, r, fill, outline=BLACK, lw=6):
    pts = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=outline, width=lw)


def circle(draw, cx, cy, r, fill, outline=BLACK, lw=6):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=outline, width=lw)


def triangle(draw, pts, fill, outline=BLACK, lw=6):
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=outline, width=lw)


def plus(draw, cx, cy, s, fill=BLACK):
    a = s // 3
    draw.rectangle((cx - a, cy - s, cx + a, cy + s), fill=fill)
    draw.rectangle((cx - s, cy - a, cx + s, cy + a), fill=fill)


def chevron(draw, cx, cy, s, direction="right", fill=BLACK, lw=14):
    if direction == "right":
        pts = [(cx - s, cy - s), (cx + s, cy), (cx - s, cy + s)]
    elif direction == "left":
        pts = [(cx + s, cy - s), (cx - s, cy), (cx + s, cy + s)]
    elif direction == "up":
        pts = [(cx - s, cy + s), (cx, cy - s), (cx + s, cy + s)]
    else:
        pts = [(cx - s, cy - s), (cx, cy + s), (cx + s, cy - s)]
    draw.line(pts, fill=fill, width=lw, joint="curve")


def star(draw, cx, cy, r, fill, outline=BLACK, lw=5):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr))
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=outline, width=lw)


def ball(draw, cx, cy, r, fill=ORANGE):
    circle(draw, cx, cy, r, fill, lw=6)
    draw.arc((cx - r, cy - r, cx + r, cy + r), 210, 330, fill=BLACK, width=5)
    draw.arc((cx - r, cy - r, cx + r, cy + r), 30, 150, fill=BLACK, width=5)
    draw.line((cx - r, cy, cx + r, cy), fill=BLACK, width=5)
    draw.line((cx, cy - r, cx, cy + r), fill=BLACK, width=5)


def trophy(draw, cx, cy, s, fill=GOLD):
    roundrect(draw, (cx - s, cy - s, cx + s, cy + s // 2), 12, fill, lw=5)
    rect(draw, (cx - s // 2, cy + s // 2, cx + s // 2, cy + s), fill, lw=5)
    rect(draw, (cx - s, cy + s, cx + s, cy + s + 20), fill, lw=5)
    draw.arc((cx - s * 2, cy - s // 2, cx - s // 2, cy + s), 270, 90, fill=BLACK, width=6)
    draw.arc((cx + s // 2, cy - s // 2, cx + s * 2, cy + s), 90, 270, fill=BLACK, width=6)


def gear(draw, cx, cy, s, fill=GREY):
    for angle in range(0, 360, 45):
        x = cx + math.cos(math.radians(angle)) * s * 0.7
        y = cy + math.sin(math.radians(angle)) * s * 0.7
        rect(draw, (x - 12, y - 12, x + 12, y + 12), fill, lw=4)
    circle(draw, cx, cy, s, fill, lw=5)
    circle(draw, cx, cy, int(s * 0.35), WHITE, lw=5)


def lock(draw, cx, cy, s, fill=GREY):
    draw.arc((cx - s, cy - s, cx + s, cy + s), 200, 340, fill=BLACK, width=8)
    roundrect(draw, (cx - s, cy, cx + s, cy + int(s * 1.4)), 10, fill, lw=5)


def coin(draw, cx, cy, r, fill=GOLD):
    circle(draw, cx, cy, r, fill, lw=5)
    circle(draw, cx, cy, int(r * 0.62), (255, 223, 104, 255), lw=4)


def magnify(draw, cx, cy, s, fill=LIGHT):
    circle(draw, cx - s // 4, cy - s // 4, s // 2, fill, lw=6)
    draw.line((cx + s // 8, cy + s // 8, cx + s, cy + s), fill=BLACK, width=10)


def check(draw, cx, cy, s, fill=BLACK, lw=14):
    draw.line((cx - s, cy, cx - s // 4, cy + s, cx + s, cy - s), fill=fill, width=lw, joint="curve")


def xmark(draw, cx, cy, s, fill=BLACK, lw=14):
    draw.line((cx - s, cy - s, cx + s, cy + s), fill=fill, width=lw)
    draw.line((cx + s, cy - s, cx - s, cy + s), fill=fill, width=lw)


def home(draw, cx, cy, s, fill=CYAN):
    triangle(draw, [(cx - s, cy), (cx, cy - s), (cx + s, cy)], fill, lw=5)
    rect(draw, (cx - int(s * 0.65), cy, cx + int(s * 0.65), cy + s), fill, lw=5)


def shield(draw, cx, cy, s, fill=BLUE):
    pts = [
        (cx, cy - s),
        (cx + s, cy - s // 2),
        (cx + int(s * 0.75), cy + s // 2),
        (cx, cy + s),
        (cx - int(s * 0.75), cy + s // 2),
        (cx - s, cy - s // 2),
    ]
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=BLACK, width=5)


def lightning(draw, cx, cy, s, fill=GOLD):
    pts = [
        (cx + s // 5, cy - s),
        (cx - s // 2, cy + s // 8),
        (cx, cy + s // 8),
        (cx - s // 5, cy + s),
        (cx + s // 2, cy - s // 8),
        (cx, cy - s // 8),
    ]
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=BLACK, width=5)


def person(draw, cx, cy, s, fill=LIGHT):
    circle(draw, cx, cy - s // 3, s // 3, fill, lw=5)
    roundrect(draw, (cx - s // 2, cy, cx + s // 2, cy + s), 12, fill, lw=5)


def save_sheet(name, im):
    im.save(OUT / name)


def sheet_01():
    im = canvas()
    draw = draw_for(im)
    items = [
        (90, 90, 620, 240, 28, PANEL),
        (780, 90, 520, 240, 0, PANEL2),
        (1380, 90, 520, 240, 42, DARK),
        (90, 430, 820, 360, 34, DARK),
        (1000, 430, 420, 360, 26, PANEL),
        (1500, 430, 360, 360, 0, PANEL2),
        (90, 900, 520, 680, 36, DARK),
        (700, 900, 560, 680, 20, PANEL),
        (1350, 900, 520, 680, 60, PANEL2),
    ]
    for x, y, w, h, cut, fill in items:
        if cut:
            cut_rect(draw, x, y, w, h, cut, fill)
        else:
            rect(draw, (x, y, x + w, y + h), fill, lw=6)
    for y in [1660, 1740, 1820]:
        rect(draw, (100, y, 760, y + 24), PANEL, lw=4)
    for x in [900, 1030, 1160, 1290]:
        roundrect(draw, (x, 1660, x + 70, 1900), 28, PANEL2, lw=5)
    for x in [1450, 1580, 1710]:
        draw.line((x, 1660, x + 90, 1660, x + 90, 1750), fill=BLACK, width=8)
        draw.line((x, 1900, x + 90, 1900, x + 90, 1810), fill=BLACK, width=8)
    save_sheet("01_frames_panels_split.png", im)


def sheet_02():
    im = canvas()
    draw = draw_for(im)
    for x, y, w, h, fill in [
        (80, 80, 330, 120, GOLD),
        (460, 80, 330, 120, PANEL),
        (840, 80, 330, 120, RED),
        (1220, 80, 330, 120, DISABLED),
        (1600, 80, 260, 120, CYAN),
    ]:
        cut_rect(draw, x, y, w, h, 22, fill)
    for x in [100, 320, 540, 760, 980, 1200, 1420, 1640]:
        roundrect(draw, (x, 290, x + 150, 440), 22, PANEL2, lw=6)
    for x in [100, 330, 560, 790, 1020, 1250, 1480, 1710]:
        circle(draw, x + 75, 610, 72, PANEL, lw=6)

    icon_fns = [
        lambda dr, cx, cy: check(dr, cx, cy, 46),
        lambda dr, cx, cy: xmark(dr, cx, cy, 46),
        lambda dr, cx, cy: chevron(dr, cx, cy, 44, "left"),
        lambda dr, cx, cy: chevron(dr, cx, cy, 44, "right"),
        lambda dr, cx, cy: plus(dr, cx, cy, 46),
        lambda dr, cx, cy: gear(dr, cx, cy, 54),
        lambda dr, cx, cy: ball(dr, cx, cy, 56),
        lambda dr, cx, cy: coin(dr, cx, cy, 56),
        lambda dr, cx, cy: trophy(dr, cx, cy, 46),
        lambda dr, cx, cy: magnify(dr, cx, cy, 54),
        lambda dr, cx, cy: lock(dr, cx, cy, 44),
        lambda dr, cx, cy: home(dr, cx, cy, 50),
        lambda dr, cx, cy: shield(dr, cx, cy, 52),
        lambda dr, cx, cy: lightning(dr, cx, cy, 52),
        lambda dr, cx, cy: star(dr, cx, cy, 58, GOLD),
        lambda dr, cx, cy: person(dr, cx, cy, 52),
    ]
    for i, fn in enumerate(icon_fns):
        fn(draw, 170 + (i % 8) * 235, 920 + (i // 8) * 260)
    roundrect(draw, (120, 1580, 420, 1690), 52, LIGHT, lw=6)
    circle(draw, 180, 1635, 44, GREEN, lw=5)
    roundrect(draw, (520, 1580, 820, 1690), 52, LIGHT, lw=6)
    circle(draw, 760, 1635, 44, DISABLED, lw=5)
    for x in [960, 1240, 1520]:
        cut_rect(draw, x, 1560, 220, 120, 20, PANEL)
    save_sheet("02_button_bases_and_icons_split.png", im)


def sheet_03():
    im = canvas()
    draw = draw_for(im)
    for x, y, w, h in [(90, 90, 900, 90), (90, 250, 900, 130), (90, 470, 900, 60), (90, 620, 900, 160)]:
        roundrect(draw, (x, y, x + w, y + h), 18, WHITE, lw=7)
    for i, color in enumerate([GREEN, BLUE, PURPLE, ORANGE, RED, GOLD, CYAN]):
        roundrect(draw, (1120, 90 + i * 120, 1780, 90 + i * 120 + 72), 12, color, lw=5)
    for i, color in enumerate([GREEN, ORANGE, RED, BLUE]):
        rect(draw, (90 + i * 230, 900, 250 + i * 230, 980), color, lw=5)
    for i, color in enumerate([GREEN, BLUE, ORANGE, RED]):
        circle(draw, 120 + i * 180, 1130, 48, color, lw=5)
        rect(draw, (95 + i * 180, 1210, 145 + i * 180, 1370), color, lw=5)
    for x in [900, 1040, 1180, 1320, 1460]:
        draw.rectangle((x, 1110, x + 24, 1260), fill=BLACK)
    for i, color in enumerate([GOLD, ORANGE, RED]):
        triangle(draw, [(900 + i * 220, 1450), (960 + i * 220, 1330), (1020 + i * 220, 1450)], color, lw=5)
    circle(draw, 340, 1640, 150, WHITE, lw=7)
    draw.arc((190, 1490, 490, 1790), 220, 360, fill=GREEN, width=36)
    draw.arc((190, 1490, 490, 1790), 20, 120, fill=ORANGE, width=36)
    circle(draw, 780, 1640, 150, WHITE, lw=7)
    draw.pieslice((630, 1490, 930, 1790), -90, 40, fill=GREEN)
    circle(draw, 780, 1640, 108, WHITE, outline=WHITE, lw=0)
    circle(draw, 780, 1640, 150, (0, 0, 0, 0), lw=7)
    for i in range(10):
        draw.line((1180 + i * 70, 1500, 1120 + i * 70, 1700), fill=BLACK, width=8)
    save_sheet("03_progress_bars_split.png", im)


def sheet_04():
    im = canvas()
    draw = draw_for(im)
    for shape, x, y in [("sq", 90, 80), ("round", 360, 80), ("hex", 630, 80), ("diamond", 900, 80)]:
        if shape == "sq":
            roundrect(draw, (x, y, x + 180, y + 180), 22, WHITE, lw=6)
        elif shape == "round":
            circle(draw, x + 90, y + 90, 90, WHITE, lw=6)
        elif shape == "hex":
            pts = [(x + 90, y), (x + 180, y + 50), (x + 180, y + 130), (x + 90, y + 180), (x, y + 130), (x, y + 50)]
            draw.polygon(pts, fill=WHITE)
            draw.line(pts + [pts[0]], fill=BLACK, width=6)
        else:
            diamond(draw, x + 90, y + 90, 95, WHITE, lw=6)
    for i, color in enumerate(QUALITY):
        x = 90 + (i % 4) * 430
        y = 350 + (i // 4) * 290
        roundrect(draw, (x, y, x + 250, y + 250), 28, WHITE, lw=6)
        roundrect(draw, (x + 20, y + 20, x + 230, y + 230), 24, color, lw=12)
    x = 90 + 3 * 430
    y = 350 + 1 * 290
    for j, color in enumerate([RED, ORANGE, GOLD, GREEN, BLUE, PURPLE, PINK]):
        draw.arc((x + 20 + j * 2, y + 20 + j * 2, x + 230 - j * 2, y + 230 - j * 2), j * 50, j * 50 + 45, fill=color, width=14)
    roundrect(draw, (x + 20, y + 20, x + 230, y + 230), 24, (0, 0, 0, 0), lw=6)
    for i, color in enumerate(QUALITY):
        star(draw, 170 + i * 250, 1160, 70, color)
    for i, color in enumerate(QUALITY):
        diamond(draw, 170 + i * 250, 1420, 78, color)
    for i, color in enumerate([PANEL, PANEL2, DARK, GOLD]):
        cut_rect(draw, 100 + i * 460, 1680, 360, 130, 18, color)
    save_sheet("04_player_quality_parts_split.png", im)


def sheet_05():
    im = canvas()
    draw = draw_for(im)
    for i, color in enumerate([DARK, PANEL, PANEL2]):
        cut_rect(draw, 80 + i * 650, 80, 560, 760, 44, color)
    for x in [140, 790, 1440]:
        roundrect(draw, (x, 170, x + 440, 480), 24, WHITE, lw=6)
    for i in range(5):
        rect(draw, (130 + i * 360, 940, 420 + i * 360, 1010), PANEL, lw=5)
    for i, color in enumerate([WHITE, LIGHT, PANEL, GOLD, RED, BLUE, PURPLE, ORANGE]):
        roundrect(draw, (110 + (i % 4) * 450, 1160 + (i // 4) * 300, 350 + (i % 4) * 450, 1400 + (i // 4) * 300), 26, color, lw=6)
    chevron(draw, 520, 1760, 60, "right")
    chevron(draw, 690, 1760, 60, "left")
    for x in [900, 1040, 1180, 1320]:
        draw.rectangle((x, 1660, x + 24, 1880), fill=BLACK)
    for x, color in [(1500, GREEN), (1660, RED)]:
        triangle(draw, [(x, 1840), (x + 70, 1660), (x + 140, 1840)], color, lw=6)
    save_sheet("05_card_and_slot_parts_split.png", im)


def sheet_06():
    im = canvas()
    draw = draw_for(im)
    cut_rect(draw, 80, 80, 780, 170, 28, DARK)
    cut_rect(draw, 1180, 80, 780, 170, 28, DARK)
    diamond(draw, 1024, 165, 80, GOLD)
    for x, color in [(160, BLUE), (380, ORANGE), (600, RED), (1300, GREEN), (1520, PURPLE), (1740, GOLD)]:
        shield(draw, x, 430, 70, color)
    roundrect(draw, (780, 360, 1260, 500), 28, WHITE, lw=6)
    for i, color in enumerate([GREEN, BLUE, ORANGE, RED]):
        circle(draw, 420 + i * 330, 680, 70, color, lw=6)
    for x in [100, 360, 620, 880, 1140, 1400, 1660]:
        roundrect(draw, (x, 880, x + 180, 1060), 28, PANEL, lw=6)
    roundrect(draw, (100, 1230, 900, 1340), 18, WHITE, lw=6)
    roundrect(draw, (1140, 1230, 1940, 1340), 18, WHITE, lw=6)
    for i, color in enumerate([GREEN, RED, GOLD, BLUE]):
        roundrect(draw, (150 + i * 450, 1490, 500 + i * 450, 1650), 24, color, lw=6)
    circle(draw, 260, 1850, 70, LIGHT, lw=6)
    draw.rectangle((320, 1840, 430, 1870), fill=LIGHT, outline=BLACK, width=5)
    circle(draw, 620, 1850, 80, WHITE, lw=6)
    draw.line((620, 1850, 620, 1790), fill=BLACK, width=8)
    draw.line((620, 1850, 680, 1880), fill=BLACK, width=8)
    draw.line((980, 1760, 980, 1940), fill=BLACK, width=10)
    triangle(draw, [(990, 1770), (1160, 1820), (990, 1870)], RED, lw=5)
    save_sheet("06_match_hud_parts_split.png", im)


def sheet_07():
    im = canvas()
    draw = draw_for(im)
    for i, color in enumerate([DARK, PANEL, PANEL2, GOLD]):
        cut_rect(draw, 80 + i * 470, 80, 390, 260, 28, color)
    for i, color in enumerate([GOLD, ORANGE, GREEN, BLUE, PURPLE, RED, PINK]):
        coin(draw, 170 + i * 260, 540, 70, color)
    for i, color in enumerate([GOLD, PANEL, RED, BLUE]):
        x = 120 + i * 460
        y = 780
        rect(draw, (x, y + 70, x + 280, y + 230), color, lw=6)
        draw.rectangle((x, y + 40, x + 280, y + 100), fill=color, outline=BLACK, width=6)
        circle(draw, x + 140, y + 145, 24, WHITE, lw=5)
    for x, color in [(140, GREEN), (500, BLUE), (860, ORANGE), (1220, PURPLE), (1580, RED)]:
        cut_rect(draw, x, 1160, 260, 150, 18, color)
    for x in [220, 580, 940, 1300, 1660]:
        triangle(draw, [(x - 35, 1510), (x - 35, 1630), (x + 65, 1570)], GOLD, lw=6)
    for x, color in [(250, GOLD), (560, ORANGE), (870, RED), (1180, BLUE), (1490, PINK)]:
        star(draw, x, 1840, 86, color)
    save_sheet("07_reward_currency_parts_split.png", im)


def sheet_08():
    im = canvas()
    draw = draw_for(im)
    for i, color in enumerate([GOLD, CYAN, RED, GREEN]):
        roundrect(draw, (80 + i * 480, 80, 420 + i * 480, 260), 30, WHITE, outline=color, lw=12)
    icon_fns = [gear, lock, home, shield, lightning, ball, coin, trophy, magnify]
    for i, fn in enumerate(icon_fns):
        fn(draw, 170 + (i % 5) * 380, 520 + (i // 5) * 300, 62)
    cx, cy = 170, 1220
    pts = [(cx - 70, cy - 30), (cx - 25, cy - 30), (cx + 30, cy - 80), (cx + 30, cy + 80), (cx - 25, cy + 30), (cx - 70, cy + 30)]
    draw.polygon(pts, fill=CYAN)
    draw.line(pts + [pts[0]], fill=BLACK, width=6)
    draw.arc((cx + 40, cy - 60, cx + 130, cy + 60), -45, 45, fill=BLACK, width=7)
    cx = 550
    draw.line((cx, 1130, cx, 1290), fill=BLACK, width=10)
    draw.line((cx, 1130, cx + 110, 1160), fill=BLACK, width=10)
    circle(draw, cx - 30, 1290, 34, PURPLE, lw=5)
    cx = 930
    draw.arc((cx - 70, cy - 70, cx + 70, cy + 90), 200, -20, fill=BLACK, width=8)
    rect(draw, (cx - 60, cy + 20, cx + 60, cy + 70), GOLD, lw=5)
    circle(draw, cx, cy + 90, 20, GOLD, lw=4)
    cx = 1310
    rect(draw, (cx - 60, cy - 40, cx + 60, cy + 90), LIGHT, lw=6)
    rect(draw, (cx - 80, cy - 70, cx + 80, cy - 40), LIGHT, lw=6)
    draw.line((cx - 30, cy - 20, cx - 30, cy + 70), fill=BLACK, width=5)
    draw.line((cx + 30, cy - 20, cx + 30, cy + 70), fill=BLACK, width=5)
    cx = 1690
    draw.arc((cx - 75, cy - 75, cx + 75, cy + 75), 40, 310, fill=BLACK, width=12)
    triangle(draw, [(cx + 60, cy - 80), (cx + 110, cy - 50), (cx + 62, cy - 20)], GREEN, lw=5)
    for i, y in enumerate([1540, 1620, 1700]):
        draw.line((140, y, 520, y), fill=BLACK, width=8)
        circle(draw, 240 + i * 100, y, 28, CYAN, lw=5)
    for x in [720, 940, 1160]:
        rect(draw, (x, 1500, x + 160, 1660), WHITE, lw=6)
    for x in [1380, 1600, 1820]:
        diamond(draw, x, 1580, 82, ORANGE, lw=6)
    triangle(draw, [(220, 1940), (340, 1740), (460, 1940)], RED, lw=7)
    circle(draw, 340, 1880, 16, BLACK, outline=BLACK, lw=0)
    draw.rectangle((330, 1800, 350, 1860), fill=BLACK)
    save_sheet("08_system_misc_parts_split.png", im)


def make_overview():
    files = sorted(OUT.glob("*_split.png"))
    thumb_w, thumb_h = 512, 512
    overview = Image.new("RGBA", (thumb_w * 4, thumb_h * 2), WHITE)
    for i, path in enumerate(files):
        thumb = Image.open(path).convert("RGBA")
        thumb.thumbnail((thumb_w - 24, thumb_h - 24), Image.Resampling.LANCZOS)
        x = (i % 4) * thumb_w + (thumb_w - thumb.width) // 2
        y = (i // 4) * thumb_h + (thumb_h - thumb.height) // 2
        overview.alpha_composite(thumb, (x, y))
    overview.save(OUT / "overview_refined.png")


def main():
    for fn in [sheet_01, sheet_02, sheet_03, sheet_04, sheet_05, sheet_06, sheet_07, sheet_08]:
        fn()
    make_overview()
    print(f"saved {OUT}")


if __name__ == "__main__":
    main()
