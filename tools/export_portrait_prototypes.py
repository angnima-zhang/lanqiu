from pathlib import Path

from PIL import Image


GENERATED = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
)
OUTPUT = Path(__file__).resolve().parents[1] / "界面图合集" / "原型图-新"
OVERVIEW = Path(__file__).resolve().parents[1] / "outputs" / "prototype_redraw_overview.png"

ASSETS = {
    "主页.png": "exec-856c1eab-1a25-4eeb-adf7-9bcb19c5e00d.png",
    "备赛.png": "exec-bdae64db-1c72-4360-bc1f-fa85aa685c3f.png",
    "比赛.png": "exec-412ee679-aa11-4b9e-8290-210547dc4636.png",
    "胜利.png": "exec-1dfc1a19-00f9-45f0-816d-c527c4ed643f.png",
    "失败.png": "exec-20e47a2a-adf4-453d-897e-52aa05bc4da6.png",
    "管理层.png": "exec-15b8f57f-02d1-49e8-9e30-7b8af1beaf02.png",
    "离线收益.png": "exec-92089331-4350-4cda-9645-bc340ce2ea0f.png",
    "球员详情.png": "exec-6a19e77e-f7f2-4fac-834c-d2b685510fe7.png",
    "招募结果.png": "exec-8eb3c001-d313-42de-bc4a-85535653f2f2.png",
}


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    exported = []
    for output_name, source_name in ASSETS.items():
        source = GENERATED / source_name
        target = OUTPUT / output_name
        image = Image.open(source).convert("RGB")
        if image.width * 2 != image.height:
            raise ValueError(f"Unexpected source ratio: {source} {image.size}")
        image.resize((1080, 2160), Image.Resampling.NEAREST).save(target)
        exported.append(target)
        print(f"{output_name}: {target.stat().st_size} bytes")

    overview = Image.new("RGB", (1080, 2160), (2, 17, 26))
    for index, target in enumerate(exported):
        thumb = Image.open(target).convert("RGB").resize(
            (360, 720), Image.Resampling.NEAREST
        )
        overview.paste(thumb, ((index % 3) * 360, (index // 3) * 720))
    OVERVIEW.parent.mkdir(parents=True, exist_ok=True)
    overview.save(OVERVIEW)
    print(f"overview: {OVERVIEW}")


if __name__ == "__main__":
    main()
