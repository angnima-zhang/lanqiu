from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(r"D:\篮球")
SOURCE_DIR = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
)
OUTPUT_DIR = ROOT / "界面图合集" / "招募结果_品质组件合集"

ATLAS_SIZE = 2048
CELL_CENTERS = (341, 1024, 1707)

# source filename, final filename, normalized visible size
JOBS = [
    ("exec-734e3efe-bf01-4099-8766-fe38c85f15dc.png", "01_品质标签_九品质合集.png", (460, 170)),
    ("exec-0c754db1-668f-471c-a3c2-2fbbea4b196d.png", "02_球员背景_九品质合集.png", (420, 420)),
    ("exec-39d517ad-8872-4783-b939-a3117cdbd464.png", "03_麦穗装饰_九品质合集.png", (480, 360)),
    ("exec-4987614a-1e66-41fd-9556-ca765b5bedef.png", "04_名字框_九品质合集.png", (540, 160)),
]


def remove_edge_connected_background(image: Image.Image) -> Image.Image:
    rgb = np.array(image.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    height, width = bgr.shape[:2]
    flood_mask = np.zeros((height + 2, width + 2), dtype=np.uint8)
    flags = 4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)

    for seed in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
        cv2.floodFill(
            bgr,
            flood_mask,
            seedPoint=seed,
            newVal=(0, 0, 0),
            loDiff=(24, 24, 24),
            upDiff=(24, 24, 24),
            flags=flags,
        )

    background = flood_mask[1 : height + 1, 1 : width + 1] > 0
    alpha = np.where(background, 0, 255).astype(np.uint8)
    rgba = np.dstack((rgb, alpha))
    return Image.fromarray(rgba, "RGBA")


def extract_cell(source: Image.Image, column: int, row: int, target_size: tuple[int, int]) -> Image.Image:
    left = round(column * source.width / 3)
    top = round(row * source.height / 3)
    right = round((column + 1) * source.width / 3)
    bottom = round((row + 1) * source.height / 3)
    cell = remove_edge_connected_background(source.crop((left, top, right, bottom)))
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No visible component in cell ({column}, {row})")
    return cell.crop(bbox).resize(target_size, Image.Resampling.NEAREST)


def build_atlas(source_path: Path, output_path: Path, target_size: tuple[int, int]) -> None:
    with Image.open(source_path) as source_image:
        source = source_image.convert("RGBA")

    transparent_atlas = Image.new("RGBA", (ATLAS_SIZE, ATLAS_SIZE), (0, 0, 0, 0))
    for index in range(9):
        column = index % 3
        row = index // 3
        component = extract_cell(source, column, row, target_size)
        x = CELL_CENTERS[column] - target_size[0] // 2
        y = CELL_CENTERS[row] - target_size[1] // 2
        transparent_atlas.alpha_composite(component, (x, y))

    chroma = Image.new("RGBA", transparent_atlas.size, (255, 0, 255, 255))
    chroma.alpha_composite(transparent_atlas)
    chroma.convert("RGB").save(output_path)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, output_name, target_size in JOBS:
        output_path = OUTPUT_DIR / output_name
        build_atlas(SOURCE_DIR / source_name, output_path, target_size)
        print(output_path)


if __name__ == "__main__":
    main()
