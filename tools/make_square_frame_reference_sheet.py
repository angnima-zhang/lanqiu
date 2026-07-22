from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\篮球")
SOURCE_DIR = ROOT / "篮球CocosProject" / "assets" / "resources" / "images" / "UI" / "球员" / "头像框-方"
OUTPUT = ROOT / "outputs" / "thin_square_frames" / "square_frame_color_reference.png"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGB", (1536, 1536), (255, 0, 255))
    names = [f"头像框{i}-方.webp" if i == 0 else f"头像框{i}-方.png" for i in range(9)]

    for index, name in enumerate(names):
        with Image.open(SOURCE_DIR / name) as source:
            frame = source.convert("RGBA")
        frame.thumbnail((410, 410), Image.Resampling.NEAREST)
        cell_x = (index % 3) * 512
        cell_y = (index // 3) * 512
        x = cell_x + (512 - frame.width) // 2
        y = cell_y + (512 - frame.height) // 2
        canvas.paste(frame.convert("RGB"), (x, y), frame.getchannel("A"))

    canvas.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
