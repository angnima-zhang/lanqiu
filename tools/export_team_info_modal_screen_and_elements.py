from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\篮球")
GENERATED_SCREEN = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
    r"\exec-e0270c52-84c7-47d4-aa21-41ca8056f475.png"
)
TRANSPARENT_SOURCE = (
    ROOT
    / "outputs"
    / "team_info_modal"
    / "elements"
    / "team_info_modal_elements_transparent.png"
)

SCREEN_OUTPUT = ROOT / "界面图合集" / "原型图-新" / "球队信息弹窗.png"
ATLAS_DIR = ROOT / "界面图合集" / "原型图-新_UI元素合集"
ATLAS_OUTPUT = ATLAS_DIR / "10_球队信息弹窗_UI元素合集.png"
TRANSPARENT_ATLAS_OUTPUT = ATLAS_DIR / "10_球队信息弹窗_UI元素合集_透明.png"
SPRITE_DIR = ROOT / "界面图合集" / "原型图-新_UI元素拆分" / "10_球队信息弹窗"


# name, source crop (left, top, right, bottom), atlas paste position
ELEMENTS = [
    ("01_弹窗主底板", (103, 85, 1037, 1182), (32, 32)),
    ("02_标题分隔装饰", (1094, 141, 1907, 224), (1040, 40)),
    ("03_球队徽章", (1305, 250, 1597, 576), (1300, 150)),
    ("04_球队名称输入框", (1085, 606, 1943, 779), (1040, 510)),
    ("05_编辑铅笔图标", (1426, 820, 1571, 973), (1380, 715)),
    ("06_总评数值底板", (1083, 1013, 1943, 1186), (1040, 900)),
    ("07_统计卡底板", (103, 1245, 415, 1630), (40, 1210)),
    ("08_预算金币图标", (1127, 1326, 1365, 1538), (450, 1260)),
    ("09_球队等级图标", (1419, 1308, 1672, 1537), (760, 1250)),
    ("10_赛季战绩图标", (1718, 1297, 1958, 1537), (1070, 1245)),
    ("11_关闭按钮底板", (113, 1712, 715, 1909), (40, 1695)),
    ("12_保存按钮底板", (748, 1712, 1308, 1909), (690, 1695)),
    ("13_篮球装饰图标", (1380, 1715, 1630, 1900), (1350, 1685)),
    ("14_星光装饰图标", (1726, 1715, 1910, 1900), (1705, 1685)),
]


def save_screen() -> None:
    SCREEN_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(GENERATED_SCREEN) as source:
        screen = source.convert("RGB").resize((1080, 2160), Image.Resampling.NEAREST)
    screen.save(SCREEN_OUTPUT)


def trim_transparent(image: Image.Image, padding: int = 4) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("Element crop contains no visible pixels")
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def save_elements() -> None:
    ATLAS_DIR.mkdir(parents=True, exist_ok=True)
    SPRITE_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(TRANSPARENT_SOURCE) as source:
        transparent_source = source.convert("RGBA")

    atlas = Image.new("RGBA", (2048, 2048), (0, 0, 0, 0))
    for name, crop_box, paste_position in ELEMENTS:
        element = trim_transparent(transparent_source.crop(crop_box))
        element.save(SPRITE_DIR / f"{name}.png")
        atlas.alpha_composite(element, paste_position)

    atlas.save(TRANSPARENT_ATLAS_OUTPUT)
    chroma = Image.new("RGBA", atlas.size, (255, 0, 255, 255))
    chroma.alpha_composite(atlas)
    chroma.convert("RGB").save(ATLAS_OUTPUT)


def main() -> None:
    save_screen()
    save_elements()
    print(SCREEN_OUTPUT)
    print(ATLAS_OUTPUT)
    print(TRANSPARENT_ATLAS_OUTPUT)
    print(SPRITE_DIR)


if __name__ == "__main__":
    main()
