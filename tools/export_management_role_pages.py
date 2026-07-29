from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\篮球")
GENERATED_DIR = Path(
    r"C:\Users\ctwl\.codex\generated_images\019f313e-8691-7cb1-a19b-2c56f938414b"
)
OUTPUT_DIR = ROOT / "界面图合集" / "原型图-新"

PAGES = [
    (
        "exec-08892b70-9947-4db5-8a18-b7f81437e60b.png",
        "管理层-运营总裁.png",
    ),
    (
        "exec-f7447187-57d3-4a37-8733-3e025b8ba7b9.png",
        "管理层-主教练.png",
    ),
    (
        "exec-24218659-86c6-41e4-9b6c-bdd58902229e.png",
        "管理层-队医团队.png",
    ),
    (
        "exec-44504550-8e3c-401c-a9ce-8881c54d5d5a.png",
        "管理层-媒体团队.png",
    ),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in PAGES:
        source_path = GENERATED_DIR / source_name
        output_path = OUTPUT_DIR / output_name
        with Image.open(source_path) as source:
            page = source.convert("RGB").resize((1080, 2160), Image.Resampling.NEAREST)
        page.save(output_path)
        print(output_path)


if __name__ == "__main__":
    main()
