from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\篮球")
SOURCE = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
    r"\exec-80a62763-c707-4aa8-8f31-b72364007415.png"
)
OUTPUT_DIR = ROOT / "界面图合集" / "头像框-方_细边框"
ATLAS_PATH = OUTPUT_DIR / "头像框-方_细边框合集.png"
TRANSPARENT_ATLAS_PATH = OUTPUT_DIR / "头像框-方_细边框合集_透明.png"


def is_magenta_background(red: int, green: int, blue: int) -> bool:
    return red >= 220 and blue >= 220 and green <= 48


def normalize_atlas(source: Image.Image) -> Image.Image:
    image = source.convert("RGB").resize((2048, 2048), Image.Resampling.NEAREST)
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue = pixels[x, y]
            if is_magenta_background(red, green, blue):
                pixels[x, y] = (255, 0, 255)
    return image


def make_transparent(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            if is_magenta_background(red, green, blue):
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def extract_standard_frame(image: Image.Image, column: int, row: int) -> Image.Image:
    left = round(column * image.width / 3)
    top = round(row * image.height / 3)
    right = round((column + 1) * image.width / 3)
    bottom = round((row + 1) * image.height / 3)
    cell = image.crop((left, top, right, bottom))
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"No frame pixels found in cell {column}, {row}")

    frame = cell.crop(bbox).resize((336, 336), Image.Resampling.NEAREST)
    output = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    output.alpha_composite(frame, ((512 - 336) // 2, (512 - 336) // 2))
    return output


def compose_atlas(frames: list[Image.Image], background: tuple[int, int, int, int]) -> Image.Image:
    atlas = Image.new("RGBA", (2048, 2048), background)
    centers = [341, 1024, 1707]
    for index, frame in enumerate(frames):
        center_x = centers[index % 3]
        center_y = centers[index // 3]
        atlas.alpha_composite(frame, (center_x - 256, center_y - 256))
    return atlas


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        atlas = normalize_atlas(source)

    source_transparent = make_transparent(atlas)
    frames: list[Image.Image] = []
    for index in range(9):
        column = index % 3
        row = index // 3
        frame = extract_standard_frame(source_transparent, column, row)
        frames.append(frame)
        frame.save(OUTPUT_DIR / f"头像框{index}-方_细.png")

    transparent_atlas = compose_atlas(frames, (0, 0, 0, 0))
    transparent_atlas.save(TRANSPARENT_ATLAS_PATH)
    magenta_atlas = compose_atlas(frames, (255, 0, 255, 255)).convert("RGB")
    magenta_atlas.save(ATLAS_PATH)

    print(ATLAS_PATH)
    print(TRANSPARENT_ATLAS_PATH)
    for index in range(9):
        print(OUTPUT_DIR / f"头像框{index}-方_细.png")


if __name__ == "__main__":
    main()
