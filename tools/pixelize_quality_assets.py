from __future__ import annotations

from pathlib import Path

from PIL import Image

from pixel_street_theme import pixel_finish


ROOT = Path(r"D:\篮球")
DESIGN = ROOT / "新设计"
BACKUP = DESIGN / "_备份_参考图改版前_20260802"


def rebuild_tree(source: Path, target: Path) -> int:
    count = 0
    for source_file in source.rglob("*.png"):
        relative = source_file.relative_to(source)
        target_file = target / relative
        target_file.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source_file) as image:
            pixel_finish(image, grid=2, colors=160).save(target_file)
        count += 1
    return count


def main() -> None:
    quality_count = rebuild_tree(BACKUP / "品质素材_9档", DESIGN / "品质素材_9档")
    recruit_count = rebuild_tree(BACKUP / "招募概率_替换素材", DESIGN / "招募概率_替换素材")
    with Image.open(BACKUP / "品质素材_9档_总览.png") as image:
        pixel_finish(image, grid=2, colors=160).save(DESIGN / "品质素材_9档_总览.png")
    print(f"quality assets: {quality_count}")
    print(f"recruit replacement assets: {recruit_count}")


if __name__ == "__main__":
    main()
