from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from pixel_street_theme import pixel_finish


ROOT = Path(r"D:\篮球")
SOURCE = ROOT / "新设计" / "品质素材_9档"
OUTPUT = ROOT / "新设计" / "品质素材_按类型合图"
FONT = ROOT / "篮球CocosProject" / "assets" / "resources" / "fonts" / "zpix.ttf"


FAMILIES = [
    ("招募背景", "招募背景0{index}.png", "01_招募背景_9品质合图.png"),
    ("方头像框", "头像框{index}-方.png", "02_方头像框_9品质合图.png"),
    ("圆头像框", "头像框{index}-圆.png", "03_圆头像框_9品质合图.png"),
    ("细边框", "细边框0{index}.png", "04_细边框_9品质合图.png"),
    ("品质标签", "品质标签0{index}.png", "05_品质标签_9品质合图.png"),
    ("名牌", "名牌0{index}.png", "06_名牌_9品质合图.png"),
    ("麦穗", "麦穗0{index}.png", "07_麦穗_9品质合图.png"),
]

INDEX_NAMES = {
    0: "概念神",
    1: "新秀 / 饮水机",
    2: "轮换 / 第六人",
    3: "首发 / 核心",
    4: "全明星 / 最佳阵容",
    5: "MVP / FMVP",
    6: "名人堂",
    7: "传奇",
    8: "GOAT",
}


def tier_folder(index: int) -> Path:
    matches = list(SOURCE.glob(f"{index:02d}_*"))
    if len(matches) != 1:
        raise RuntimeError(f"Expected one source folder for quality index {index}, got {matches}")
    return matches[0]


def checker(size: tuple[int, int], step: int = 18) -> Image.Image:
    img = Image.new("RGBA", size, (242, 246, 252, 255))
    draw = ImageDraw.Draw(img)
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                draw.rectangle((x, y, x + step - 1, y + step - 1), fill=(217, 225, 237, 255))
    return img


def build_sheet(label: str, source_pattern: str, output_name: str) -> tuple[Path, dict]:
    assets: list[Image.Image] = []
    sources: list[Path] = []
    for index in range(9):
        source = tier_folder(index) / source_pattern.format(index=index)
        if not source.exists():
            raise FileNotFoundError(source)
        sources.append(source)
        assets.append(Image.open(source).convert("RGBA"))

    max_w = max(asset.width for asset in assets)
    max_h = max(asset.height for asset in assets)
    padding = 12
    cell_w, cell_h = max_w + padding * 2, max_h + padding * 2
    sheet = Image.new("RGBA", (cell_w * 3, cell_h * 3), (0, 0, 0, 0))
    entries = []

    for index, (asset, source) in enumerate(zip(assets, sources)):
        col, row = index % 3, index // 3
        cell_x, cell_y = col * cell_w, row * cell_h
        x = cell_x + (cell_w - asset.width) // 2
        y = cell_y + (cell_h - asset.height) // 2
        sheet.alpha_composite(asset, (x, y))
        entries.append({
            "index": index,
            "quality": INDEX_NAMES[index],
            "source": str(source.relative_to(ROOT)),
            "cell": {"x": cell_x, "y": cell_y, "width": cell_w, "height": cell_h},
            "asset": {"x": x, "y": y, "width": asset.width, "height": asset.height},
        })

    output_path = OUTPUT / output_name
    pixel_finish(sheet, grid=2, colors=160).save(output_path)
    metadata = {
        "family": label,
        "file": output_name,
        "background": "transparent",
        "order": "row-major, quality index 00 to 08",
        "sheetSize": {"width": sheet.width, "height": sheet.height},
        "cellSize": {"width": cell_w, "height": cell_h},
        "entries": entries,
    }
    return output_path, metadata


def build_preview(sheet_results: list[tuple[str, Path]]) -> Path:
    width, block_w, block_h = 1600, 760, 520
    rows = (len(sheet_results) + 1) // 2
    height = 90 + rows * block_h + 30
    canvas = Image.new("RGBA", (width, height), (238, 244, 253, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")
    title_font = ImageFont.truetype(str(FONT), 42)
    label_font = ImageFont.truetype(str(FONT), 31)
    draw.text((width // 2, 42), "球员品质素材 · 按类型合图总览", font=title_font,
              fill=(17, 43, 105, 255), anchor="mm")

    for n, (label, sheet_path) in enumerate(sheet_results):
        col, row = n % 2, n // 2
        x0, y0 = 20 + col * 790, 82 + row * block_h
        draw.rounded_rectangle((x0, y0, x0 + block_w, y0 + block_h - 18), radius=16,
                               fill=(255, 255, 255, 255), outline=(42, 101, 225, 255), width=4)
        draw.text((x0 + 28, y0 + 28), f"{n + 1:02d}  {label}", font=label_font,
                  fill=(20, 54, 132, 255), anchor="lm")
        area = checker((block_w - 40, block_h - 100), 16)
        sheet = Image.open(sheet_path).convert("RGBA")
        scale = min((area.width - 30) / sheet.width, (area.height - 30) / sheet.height)
        shown = sheet.resize((max(1, round(sheet.width * scale)), max(1, round(sheet.height * scale))),
                             Image.Resampling.NEAREST)
        area.alpha_composite(shown, ((area.width - shown.width) // 2, (area.height - shown.height) // 2))
        canvas.alpha_composite(area, (x0 + 20, y0 + 74))

    path = OUTPUT / "00_按类型合图总览.png"
    pixel_finish(canvas, grid=2, colors=160).save(path)
    return path


def verify_sheet(path: Path, metadata: dict) -> None:
    with Image.open(path) as image:
        if image.mode != "RGBA":
            raise AssertionError(f"{path} must be RGBA")
        expected = metadata["sheetSize"]
        if image.size != (expected["width"], expected["height"]):
            raise AssertionError(f"{path} size mismatch")
        if image.getchannel("A").getbbox() is None:
            raise AssertionError(f"{path} has no visible pixels")
        # Every production sheet must retain transparent spacing for clean cutting.
        if image.getchannel("A").getextrema()[0] != 0:
            raise AssertionError(f"{path} has no transparent padding")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    atlas = {
        "qualityIndexOrder": INDEX_NAMES,
        "note": "Production sheets have transparent backgrounds and no baked labels.",
        "sheets": [],
    }
    preview_inputs = []
    for label, source_pattern, output_name in FAMILIES:
        path, metadata = build_sheet(label, source_pattern, output_name)
        verify_sheet(path, metadata)
        atlas["sheets"].append(metadata)
        preview_inputs.append((label, path))

    preview = build_preview(preview_inputs)
    atlas_path = OUTPUT / "切图坐标.json"
    atlas_path.write_text(json.dumps(atlas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(preview)
    print(atlas_path)
    print(f"production sheets: {len(FAMILIES)}")


if __name__ == "__main__":
    main()
