import argparse
import csv
import re
import shutil
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.optimize import linear_sum_assignment


ROOT = Path(__file__).resolve().parents[1]
CROPS_ROOT = ROOT / "游戏资源" / "头像" / "拆图"
SHEET_MANIFEST = ROOT / "outputs" / "pixel_comic_headshots" / "sheet_manifest.csv"
HEADSHOT_MANIFEST = ROOT / "headshots_official" / "manifest.csv"
PLAYER_CONFIG = ROOT / "data" / "player_config_fame_v3.csv"
REPORT = CROPS_ROOT / "头像改名映射.csv"
OUTPUT = CROPS_ROOT / "已改名"

# CBA/Chinese-source rows use Chinese sourcePlayerName values in the data files.
# Convert only that field to the player's established Latin-script original name;
# displayName still comes directly from the game configuration.
ENGLISH_OVERRIDES = {
    "丁彦雨航": "Ding Yanyuhang",
    "刘玉栋": "Liu Yudong",
    "吴前": "Wu Qian",
    "唐正东": "Tang Zhengdong",
    "姚明": "Yao Ming",
    "孙军": "Sun Jun",
    "巩晓彬": "Gong Xiaobin",
    "巴特尔": "Mengke Bateer",
    "易建联": "Yi Jianlian",
    "朱芳雨": "Zhu Fangyu",
    "杜锋": "Du Feng",
    "王仕鹏": "Wang Shipeng",
    "王哲林": "Wang Zhelin",
    "王治郅": "Wang Zhizhi",
    "胡卫东": "Hu Weidong",
    "胡明轩": "Hu Mingxuan",
    "胡金秋": "Hu Jinqiu",
    "贺希宁": "He Xining",
    "赵继伟": "Zhao Jiwei",
    "阿不都沙拉木": "Abudushalamu Abudurexiti",
}


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def natural_number(path):
    match = re.search(r"(\d+)$", path.stem)
    return int(match.group(1)) if match else 10**9


def safe_filename(name):
    name = re.sub(r'[<>:"/\\|?*]', "_", name).strip().rstrip(".")
    return re.sub(r"\s+", " ", name)


def choose_sheets():
    candidates = []
    for path in ROOT.rglob("pixel_comic_sheet_*.png"):
        try:
            if Image.open(path).size == (1280, 1280):
                candidates.append(path)
        except OSError:
            pass
    sheets = {}
    for sheet in range(1, 7):
        name = f"pixel_comic_sheet_{sheet:02d}.png"
        matching = [p for p in candidates if p.name == name]
        if not matching:
            raise RuntimeError(f"Missing source sheet: {name}")
        # The copies under 游戏资源/头像/合图 have the shortest project paths.
        sheets[sheet] = min(matching, key=lambda p: len(str(p)))
    return sheets


def descriptor(image, sift):
    rgb = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    return sift.detectAndCompute(gray, None)[1]


def match_score(a, b, matcher):
    if a is None or b is None or len(a) < 2 or len(b) < 2:
        return 0
    pairs = matcher.knnMatch(a, b, k=2)
    return sum(1 for first, second in pairs if first.distance < 0.72 * second.distance)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="Copy images to the flat renamed output folder")
    args = parser.parse_args()

    sheet_rows = read_csv(SHEET_MANIFEST)
    headshot_rows = read_csv(HEADSHOT_MANIFEST)
    config_rows = read_csv(PLAYER_CONFIG)

    file_to_english = {r["file"]: r["sourcePlayerName"] for r in headshot_rows}
    display_by_english = defaultdict(set)
    for row in config_rows:
        display_by_english[row["sourcePlayerName"]].add(row["displayName"])

    sheet_slot = {}
    for row in sheet_rows:
        sheet = int(row["sheet"])
        slot = int(row["slot"])
        source_name = file_to_english[row["player_file"]]
        displays = display_by_english[source_name]
        if len(displays) != 1:
            raise RuntimeError(f"Display-name conflict for {source_name}: {sorted(displays)}")
        english = ENGLISH_OVERRIDES.get(source_name, source_name)
        sheet_slot[(sheet, slot)] = (next(iter(displays)), english)

    folders = sorted(p for p in CROPS_ROOT.glob("cropped_images_*") if p.is_dir())
    if [len(list(p.glob("player_*.png"))) for p in folders] != [25, 25, 25, 25, 25, 22]:
        raise RuntimeError("Unexpected crop-folder counts")

    sheets = choose_sheets()
    sift = cv2.SIFT_create(nfeatures=700)
    matcher = cv2.BFMatcher()
    results = []

    for sheet_number, folder in enumerate(folders, start=1):
        crop_paths = sorted(folder.glob("player_*.png"), key=natural_number)
        crop_desc = [descriptor(Image.open(p), sift) for p in crop_paths]
        source = Image.open(sheets[sheet_number])
        slot_count = 22 if sheet_number == 6 else 25
        slot_desc = []
        for slot in range(1, slot_count + 1):
            row, col = divmod(slot - 1, 5)
            cell = source.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))
            slot_desc.append(descriptor(cell, sift))

        scores = np.zeros((len(crop_paths), slot_count), dtype=np.int32)
        for i, a in enumerate(crop_desc):
            for j, b in enumerate(slot_desc):
                scores[i, j] = match_score(a, b, matcher)

        crop_indices, slot_indices = linear_sum_assignment(-scores)
        if len(crop_indices) != len(crop_paths):
            raise RuntimeError(f"Incomplete assignment for {folder.name}")

        for crop_index, slot_index in zip(crop_indices, slot_indices):
            path = crop_paths[crop_index]
            assigned = int(scores[crop_index, slot_index])
            alternatives = np.delete(scores[crop_index], slot_index)
            second = int(alternatives.max()) if len(alternatives) else 0
            display, english = sheet_slot[(sheet_number, slot_index + 1)]
            target_name = safe_filename(f"{display}_{english}.png")
            target_folder = f"第{sheet_number:02d}组"
            results.append({
                "batch": folder.name,
                "source_file": path.name,
                "sheet": sheet_number,
                "slot": slot_index + 1,
                "display_name": display,
                "english_name": english,
                "target_file": target_name,
                "target_folder": target_folder,
                "target_relative_path": str(Path(target_folder) / target_name),
                "match_score": assigned,
                "second_best_score": second,
                "score_margin": assigned - second,
                "source_path": str(path.relative_to(ROOT)),
            })

    target_paths = [r["target_relative_path"].casefold() for r in results]
    if len(results) != 147 or len(set(target_paths)) != 147:
        raise RuntimeError("Result count or grouped target paths are not unique")
    if len({(r["sheet"], r["slot"]) for r in results}) != 147:
        raise RuntimeError("Sheet slots are not one-to-one")

    with REPORT.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0]))
        writer.writeheader()
        writer.writerows(sorted(results, key=lambda r: (r["sheet"], r["slot"])))

    if args.write:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        existing = list(OUTPUT.rglob("*.png"))
        if existing:
            raise RuntimeError(f"Output folder is not empty: {OUTPUT}")
        for row in results:
            source_path = ROOT / row["source_path"]
            target_path = OUTPUT / row["target_relative_path"]
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)

    scores = [r["match_score"] for r in results]
    margins = [r["score_margin"] for r in results]
    print(f"mapped={len(results)} unique_grouped_targets={len(set(target_paths))}")
    print(f"score min/median/max={min(scores)}/{int(np.median(scores))}/{max(scores)}")
    print(f"margin min/median/max={min(margins)}/{int(np.median(margins))}/{max(margins)}")
    print(f"low_score_under_60={sum(s < 60 for s in scores)} low_margin_under_20={sum(m < 20 for m in margins)}")
    print(f"report={REPORT}")
    if args.write:
        print(f"output={OUTPUT} files={len(list(OUTPUT.rglob('*.png')))}")


if __name__ == "__main__":
    main()
