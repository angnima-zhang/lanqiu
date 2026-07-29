from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(r"D:\篮球")
SOURCE_SCREEN = ROOT / r"篮球CocosProject\assets\resources\images\原型图\比赛.png"
SOURCE_ATLAS = ROOT / r"界面图合集\原型图-新_UI元素合集\03_比赛_UI元素合集.png"
OUTPUT_DIR = ROOT / r"篮球CocosProject\assets\resources\images\UI\比赛"
OUTPUT_MAGENTA = OUTPUT_DIR / "比赛_UI元素合集.png"
OUTPUT_ALPHA = OUTPUT_DIR / "比赛_UI元素合集_透明.png"
OUTPUT_MANIFEST = OUTPUT_DIR / "比赛_UI元素合集_切图清单.json"
SPLIT_DIR = OUTPUT_DIR / "拆分"
CHROMA_HELPER = Path(
    r"C:\Users\ctwl\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py"
)

MAGENTA = (255, 0, 255, 255)
CANVAS_SIZE = (4096, 2048)
PADDING = 28


def crop_rgba(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return image.crop(box).convert("RGBA")


def chroma_to_alpha(image: Image.Image, tolerance: int = 24) -> Image.Image:
    data = np.asarray(image.convert("RGBA")).copy()
    rgb = data[..., :3].astype(np.int16)
    key = np.array(MAGENTA[:3], dtype=np.int16)
    is_key = np.max(np.abs(rgb - key), axis=2) <= tolerance
    data[..., 3] = np.where(is_key, 0, data[..., 3])
    return Image.fromarray(data)


def blank_patch(
    image: Image.Image,
    target: tuple[int, int, int, int],
    source: tuple[int, int, int, int],
) -> Image.Image:
    out = image.copy()
    patch = out.crop(source)
    size = (target[2] - target[0], target[3] - target[1])
    if patch.size != size:
        patch = patch.resize(size, Image.Resampling.NEAREST)
    out.paste(patch, target[:2])
    return out


def extract_colored_icon(
    button: Image.Image,
    region: tuple[int, int, int, int],
    mode: str,
) -> Image.Image:
    piece = button.crop(region).convert("RGBA")
    data = np.asarray(piece).copy()
    rgb = data[..., :3]
    if mode == "gold":
        mask = (
            (rgb[..., 0] > 145)
            & (rgb[..., 1] > 75)
            & (rgb[..., 2] < 90)
            & (rgb[..., 0] > rgb[..., 1] + 35)
        )
    else:
        mask = (
            (rgb[..., 0] > 130)
            & (rgb[..., 1] < 105)
            & (rgb[..., 2] < 90)
            & (rgb[..., 0] > rgb[..., 1] + 55)
        )
    mask = ndimage.binary_dilation(mask, iterations=2)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise RuntimeError(f"Could not extract {mode} fast-forward icon")
    x0, x1 = max(0, xs.min() - 2), min(piece.width, xs.max() + 3)
    y0, y1 = max(0, ys.min() - 2), min(piece.height, ys.max() + 3)
    out = data[y0:y1, x0:x1]
    local_mask = mask[y0:y1, x0:x1]
    out[..., 3] = np.where(local_mask, out[..., 3], 0)
    return Image.fromarray(out)


def make_ovr_plate() -> Image.Image:
    scale = 2
    image = Image.new("RGBA", (76, 58), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    points = [(8, 0), (68, 0), (75, 9), (73, 49), (65, 57), (10, 57), (2, 49), (0, 9)]
    draw.polygon(points, fill=(3, 14, 19, 255), outline=(2, 4, 6, 255), width=4)
    inner = [(10, 5), (65, 5), (70, 11), (68, 46), (62, 51), (13, 51), (7, 46), (5, 11)]
    draw.line(inner + [inner[0]], fill=(21, 72, 76, 255), width=scale)
    return image


def make_shot_clock() -> Image.Image:
    image = Image.new("RGBA", (76, 104), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((31, 72, 45, 101), fill=(5, 11, 14, 255), outline=(1, 3, 4, 255), width=3)
    draw.rectangle((9, 5, 67, 76), fill=(3, 8, 11, 255), outline=(1, 2, 3, 255), width=5)
    draw.rectangle((14, 10, 62, 70), fill=(8, 25, 29, 255), outline=(35, 84, 86, 255), width=3)
    draw.rectangle((20, 17, 56, 62), fill=(4, 14, 17, 255))
    draw.line((20, 17, 56, 17), fill=(68, 112, 111, 255), width=2)
    return image


def make_selected_broadcast_row() -> Image.Image:
    image = Image.new("RGBA", (1000, 112), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    gold = (236, 160, 31, 255)
    shadow = (86, 48, 10, 255)
    draw.rectangle((3, 3, 996, 108), outline=shadow, width=7)
    draw.rectangle((7, 6, 992, 104), outline=gold, width=3)
    draw.line((185, 7, 185, 103), fill=shadow, width=6)
    draw.line((188, 7, 188, 103), fill=gold, width=2)
    return image


def make_normal_broadcast_row() -> Image.Image:
    image = Image.new("RGBA", (1000, 92), (3, 18, 23, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle((1, 1, 998, 90), outline=(2, 8, 11, 255), width=4)
    draw.rectangle((6, 5, 993, 86), outline=(11, 51, 59, 255), width=2)
    draw.line((8, 8, 991, 8), fill=(18, 76, 82, 255), width=2)
    return image


def source_components(atlas: Image.Image) -> list[tuple[str, Image.Image]]:
    speed_gold = crop_rgba(atlas, (225, 1738, 570, 1873))
    speed_skip = crop_rgba(atlas, (608, 1738, 951, 1873))
    speed_gold_blank = blank_patch(speed_gold, (92, 19, 218, 116), (230, 24, 305, 111))
    speed_skip_blank = blank_patch(speed_skip, (92, 19, 218, 116), (230, 24, 305, 111))
    broadcast_shell = crop_rgba(atlas, (983, 1352, 1989, 1878))
    broadcast_shell = blank_patch(
        broadcast_shell,
        (24, 82, 982, 503),
        (320, 104, 520, 144),
    )

    return [
        ("顶部_赛事标题栏", crop_rgba(atlas, (284, 44, 1762, 152))),
        ("比分_主队信息框", crop_rgba(atlas, (283, 176, 1017, 346))),
        ("比分_客队信息框", crop_rgba(atlas, (1029, 176, 1765, 346))),
        ("比分_主队队徽示例", crop_rgba(atlas, (65, 168, 243, 346))),
        ("比分_客队队徽示例", crop_rgba(atlas, (1803, 168, 1979, 346))),
        ("比分_总比分框", crop_rgba(atlas, (194, 363, 1854, 541))),
        ("比分_单节比分框", crop_rgba(atlas, (191, 555, 596, 717))),
        ("顶部_直播状态圆点", crop_rgba(atlas, (1917, 629, 1965, 676))),
        ("球场_完整背景", crop_rgba(atlas, (140, 745, 1906, 1326))),
        ("品质圆框_绿色", crop_rgba(atlas, (44, 1349, 206, 1514))),
        ("品质圆框_蓝色", crop_rgba(atlas, (235, 1349, 397, 1514))),
        ("品质圆框_紫色", crop_rgba(atlas, (428, 1349, 590, 1514))),
        ("品质圆框_金色", crop_rgba(atlas, (44, 1535, 207, 1700))),
        ("品质圆框_红色", crop_rgba(atlas, (235, 1535, 397, 1700))),
        ("品质圆框_粉色", crop_rgba(atlas, (428, 1535, 590, 1700))),
        ("球场_篮球", crop_rgba(atlas, (639, 1439, 707, 1512))),
        ("球场_传球轨迹", crop_rgba(atlas, (725, 1408, 970, 1528))),
        ("播报_外框底板", broadcast_shell),
        ("播报_普通行底板", make_normal_broadcast_row()),
        ("播报_时间格底板", crop_rgba(atlas, (44, 1744, 176, 1862))),
        ("播报_高亮行描边", make_selected_broadcast_row()),
        ("按钮_二倍速底板", speed_gold_blank),
        ("按钮_跳过底板", speed_skip_blank),
        ("按钮_二倍速图标", extract_colored_icon(speed_gold, (90, 18, 220, 117), "gold")),
        ("按钮_跳过图标", extract_colored_icon(speed_skip, (90, 18, 220, 117), "orange")),
        ("播报_标题装饰", crop_rgba(atlas, (735, 1908, 1310, 1992))),
        ("球员_OVR牌底板", make_ovr_plate()),
        ("球场_进攻计时牌底板", make_shot_clock()),
    ]


def pack(
    assets: list[tuple[str, Image.Image]],
) -> tuple[Image.Image, dict[str, dict[str, int]]]:
    canvas = Image.new("RGBA", CANVAS_SIZE, MAGENTA)
    ordered = sorted(assets, key=lambda item: (-item[1].height, -item[1].width))
    x = PADDING
    y = PADDING
    shelf_height = 0
    manifest: dict[str, dict[str, int]] = {}

    for name, raw in ordered:
        asset = chroma_to_alpha(raw)
        if x + asset.width + PADDING > CANVAS_SIZE[0]:
            x = PADDING
            y += shelf_height + PADDING
            shelf_height = 0
        if y + asset.height + PADDING > CANVAS_SIZE[1]:
            raise RuntimeError(f"Atlas overflow while placing {name}")
        canvas.alpha_composite(asset, (x, y))
        manifest[name] = {
            "x": x,
            "y": y,
            "width": asset.width,
            "height": asset.height,
        }
        x += asset.width + PADDING
        shelf_height = max(shelf_height, asset.height)

    return canvas, manifest


def save_split(alpha_atlas: Image.Image, manifest: dict[str, dict[str, int]]) -> None:
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    expected = {f"{name}.png" for name in manifest}
    for existing in SPLIT_DIR.glob("*.png"):
        if existing.name not in expected:
            existing.unlink()
    for name, rect in manifest.items():
        box = (
            rect["x"],
            rect["y"],
            rect["x"] + rect["width"],
            rect["y"] + rect["height"],
        )
        alpha_atlas.crop(box).save(SPLIT_DIR / f"{name}.png")


def main() -> None:
    atlas = Image.open(SOURCE_ATLAS).convert("RGBA")
    assets = source_components(atlas)
    magenta, manifest = pack(assets)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    magenta.convert("RGB").save(OUTPUT_MAGENTA, optimize=True)
    subprocess.run(
        [
            "python",
            str(CHROMA_HELPER),
            "--input",
            str(OUTPUT_MAGENTA),
            "--out",
            str(OUTPUT_ALPHA),
            "--key-color",
            "#FF00FF",
            "--soft-matte",
            "--transparent-threshold",
            "18",
            "--opaque-threshold",
            "110",
            "--edge-contract",
            "1",
            "--despill",
            "--force",
        ],
        check=True,
    )
    alpha = Image.open(OUTPUT_ALPHA).convert("RGBA")
    save_split(alpha, manifest)

    payload = {
        "sourceScreen": str(SOURCE_SCREEN),
        "atlas": OUTPUT_MAGENTA.name,
        "transparentAtlas": OUTPUT_ALPHA.name,
        "canvas": {"width": CANVAS_SIZE[0], "height": CANVAS_SIZE[1]},
        "background": "#FF00FF",
        "assetCount": len(manifest),
        "assets": manifest,
    }
    OUTPUT_MANIFEST.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote: {OUTPUT_MAGENTA}")
    print(f"wrote: {OUTPUT_ALPHA}")
    print(f"wrote: {OUTPUT_MANIFEST}")
    print(f"split assets: {len(manifest)} -> {SPLIT_DIR}")


if __name__ == "__main__":
    main()
