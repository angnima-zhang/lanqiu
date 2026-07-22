from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
)
OUTPUT = ROOT / "界面图合集" / "原型图-新_UI元素合集"
OVERVIEW = ROOT / "outputs" / "prototype_ui_atlases_overview.png"

ASSETS = {
    "01_主页_UI元素合集.png": "exec-82a20eaf-c0b3-4339-8ee6-64e88e762374.png",
    "02_备赛_UI元素合集.png": "exec-3f35a5ce-4ad8-41b5-a6d5-03bd6cdb95e8.png",
    "03_比赛_UI元素合集.png": "exec-e005449f-99ec-4b4e-8408-0e637eae40cc.png",
    "04_胜利_UI元素合集.png": "exec-49fa6e6b-cff0-4914-ba4d-7e5447cd9fbb.png",
    "05_失败_UI元素合集.png": "exec-1a1c23f2-475c-4b75-8319-0615228be068.png",
    "06_管理层_UI元素合集.png": "exec-0ac57287-af76-47b5-aa51-cf3e6de72d6a.png",
    "07_离线收益_UI元素合集.png": "exec-bc991f80-1130-49f7-973d-83f94b08e71b.png",
    "08_球员详情_UI元素合集.png": "exec-b26e1295-8c2c-40b8-a697-7ff89bff5b77.png",
    "09_招募结果_UI元素合集.png": "exec-d97d0ca3-9523-4def-bdc7-ad6756d799e4.png",
}


def normalize_chroma(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b = pixels[x, y]
            if r >= 150 and b >= 150 and g <= 110 and abs(r - b) <= 45:
                pixels[x, y] = (255, 0, 255)
    return image


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    exported = []
    for output_name, source_name in ASSETS.items():
        source = GENERATED / source_name
        target = OUTPUT / output_name
        image = normalize_chroma(Image.open(source))
        image.resize((2048, 2048), Image.Resampling.NEAREST).save(target)
        exported.append(target)
        print(f"{output_name}: {target.stat().st_size} bytes")

    overview = Image.new("RGB", (1536, 1536), (255, 0, 255))
    for index, target in enumerate(exported):
        thumb = Image.open(target).convert("RGB").resize(
            (512, 512), Image.Resampling.NEAREST
        )
        overview.paste(thumb, ((index % 3) * 512, (index // 3) * 512))
    OVERVIEW.parent.mkdir(parents=True, exist_ok=True)
    overview.save(OVERVIEW)
    print(f"overview: {OVERVIEW}")


if __name__ == "__main__":
    main()
