from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
    r"\exec-094d3aae-02d5-4506-baa9-bd132dca4fe8.png"
)
OUTPUT_DIR = ROOT / "outputs" / "team_info_modal" / "elements"
SOURCE_COPY = OUTPUT_DIR / "team_info_modal_elements_chroma_source.png"
FINAL = OUTPUT_DIR / "team_info_modal_elements_atlas_v1.png"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    image = Image.open(SOURCE).convert("RGB")
    image.save(SOURCE_COPY)

    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b = pixels[x, y]
            if r >= 150 and b >= 150 and g <= 110 and abs(r - b) <= 45:
                pixels[x, y] = (255, 0, 255)

    # Keep one reusable statistics-card base; remove the two generated duplicates.
    draw = ImageDraw.Draw(image)
    draw.rectangle((270, 755, 670, 1005), fill=(255, 0, 255))

    image = image.resize((2048, 2048), Image.Resampling.NEAREST)
    image.save(FINAL)
    print(FINAL)


if __name__ == "__main__":
    main()
