from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(r"D:\篮球")
SOURCE_ATLAS = ROOT / r"界面图合集\原型图-新_UI元素合集\06_管理层_UI元素合集.png"
ROLE_SHEET = Path(
    r"C:\Users\ctwl\.codex\generated_images"
    r"\019f313e-8691-7cb1-a19b-2c56f938414b"
    r"\call_d7e7XcJCLm5J8gpFjSkzhFRX.png"
)
OUTPUT_DIR = ROOT / r"界面图合集\原型图-新_UI元素合集"
OUTPUT_MAGENTA = OUTPUT_DIR / "06_管理层五界面_UI元素合集.png"
OUTPUT_ALPHA = OUTPUT_DIR / "06_管理层五界面_UI元素合集_透明.png"
OUTPUT_MANIFEST = OUTPUT_DIR / "06_管理层五界面_UI元素合集_切图清单.json"
SPLIT_DIR = OUTPUT_DIR / "06_管理层五界面_UI元素拆分"
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


def extract_cream_arrow(button: Image.Image) -> Image.Image:
    data = np.asarray(button.convert("RGBA")).copy()
    rgb = data[..., :3]
    cream = (
        (rgb[..., 0] > 145)
        & (rgb[..., 1] > 115)
        & (rgb[..., 2] > 70)
        & (rgb[..., 0] > rgb[..., 2] + 35)
    )
    cream = ndimage.binary_dilation(cream, iterations=3)
    ys, xs = np.where(cream)
    if len(xs) == 0:
        raise RuntimeError("Back-arrow extraction failed")
    x0, x1 = max(0, xs.min() - 2), min(button.width, xs.max() + 3)
    y0, y1 = max(0, ys.min() - 2), min(button.height, ys.max() + 3)
    out = data[y0:y1, x0:x1]
    local_mask = cream[y0:y1, x0:x1]
    out[..., 3] = np.where(local_mask, out[..., 3], 0)
    return Image.fromarray(out)


def blank_patch(
    image: Image.Image,
    target: tuple[int, int, int, int],
    source: tuple[int, int, int, int],
) -> Image.Image:
    out = image.copy()
    patch = out.crop(source)
    tw = target[2] - target[0]
    th = target[3] - target[1]
    if patch.size != (tw, th):
        patch = patch.resize((tw, th), Image.Resampling.NEAREST)
    out.paste(patch, target[:2])
    return out


def source_components(source: Image.Image) -> list[tuple[str, Image.Image]]:
    back = crop_rgba(source, (73, 62, 238, 206))
    back_blank = blank_patch(back, (16, 16, 149, 128), (135, 16, 149, 128))
    arrow = extract_cream_arrow(back)

    tip = crop_rgba(source, (73, 1494, 959, 1638))
    tip_blank = blank_patch(tip, (20, 16, 224, 130), (260, 16, 464, 130))

    cost = crop_rgba(source, (1009, 1494, 1973, 1638))
    cost_blank = blank_patch(cost, (20, 14, 225, 132), (300, 14, 505, 132))

    button = crop_rgba(source, (335, 1702, 1473, 1927))
    button_blank = blank_patch(button, (38, 22, 272, 205), (330, 22, 564, 205))

    return [
        ("公共_返回按钮底板", back_blank),
        ("公共_返回箭头", arrow),
        ("公共_预算计数框", crop_rgba(source, (1638, 87, 1966, 189))),
        ("公共_岗位标签底板_未选", crop_rgba(source, (332, 256, 559, 529))),
        ("公共_岗位标签底板_选中", crop_rgba(source, (583, 255, 815, 529))),
        ("岗位图标_运营总裁", crop_rgba(source, (890, 292, 1024, 485))),
        ("岗位图标_主教练", crop_rgba(source, (1107, 304, 1262, 485))),
        ("岗位图标_球探总监", crop_rgba(source, (1310, 314, 1507, 485))),
        ("岗位图标_队医团队", crop_rgba(source, (1560, 302, 1713, 483))),
        ("岗位图标_媒体团队", crop_rgba(source, (1790, 297, 1961, 490))),
        ("公共_人物信息大框", crop_rgba(source, (70, 573, 1223, 1089))),
        ("公共_等级进度条外框", crop_rgba(source, (1289, 735, 1961, 797))),
        ("公共_等级进度条填充", crop_rgba(source, (1290, 851, 1437, 905))),
        ("公共_当前效果框", crop_rgba(source, (73, 1148, 861, 1444))),
        ("公共_向下箭头", crop_rgba(source, (882, 1246, 964, 1338))),
        ("公共_下一等级效果框", crop_rgba(source, (993, 1125, 1953, 1455))),
        ("公共_说明框底板", tip_blank),
        ("公共_升级消耗框底板", cost_blank),
        ("公共_篮球币图标", crop_rgba(source, (88, 1744, 222, 1883))),
        ("公共_升级按钮底板", button_blank),
        ("公共_焦点装饰框", crop_rgba(source, (1528, 1705, 1975, 1932))),
    ]


def role_scenes(sheet: Image.Image) -> list[tuple[str, Image.Image]]:
    boxes = [
        ("岗位场景_运营总裁", (17, 58, 512, 477)),
        ("岗位场景_主教练", (532, 58, 1009, 477)),
        ("岗位场景_球探总监", (1023, 58, 1500, 477)),
        ("岗位场景_队医团队", (216, 512, 729, 947)),
        ("岗位场景_媒体团队", (779, 512, 1285, 947)),
    ]
    return [(name, crop_rgba(sheet, box)) for name, box in boxes]


def pack(
    assets: list[tuple[str, Image.Image]],
) -> tuple[Image.Image, Image.Image, dict[str, dict[str, int]]]:
    magenta = Image.new("RGBA", CANVAS_SIZE, MAGENTA)
    alpha = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))

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

        magenta.alpha_composite(asset, (x, y))
        alpha.alpha_composite(asset, (x, y))
        manifest[name] = {
            "x": x,
            "y": y,
            "width": asset.width,
            "height": asset.height,
        }
        x += asset.width + PADDING
        shelf_height = max(shelf_height, asset.height)

    return magenta, alpha, manifest


def save_split(
    alpha_atlas: Image.Image,
    manifest: dict[str, dict[str, int]],
) -> None:
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    for name, rect in manifest.items():
        box = (
            rect["x"],
            rect["y"],
            rect["x"] + rect["width"],
            rect["y"] + rect["height"],
        )
        alpha_atlas.crop(box).save(SPLIT_DIR / f"{name}.png")


def main() -> None:
    source = Image.open(SOURCE_ATLAS).convert("RGBA")
    roles = Image.open(ROLE_SHEET).convert("RGBA")
    assets = source_components(source) + role_scenes(roles)

    magenta, _, manifest = pack(assets)
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
