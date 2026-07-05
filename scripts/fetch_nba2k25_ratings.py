#!/usr/bin/env python3
"""Download and normalize NBA 2K25 rating/potential data."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


DATASET = "reinerjasin/nba-2k25-player-complete-dataset"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw" / "nba-2k25-player-complete-dataset"
OUT_CSV = DATA_DIR / "nba2k25_player_ratings.csv"
OUT_JSON = DATA_DIR / "nba2k25_player_ratings.json"
META_JSON = DATA_DIR / "nba2k25_player_ratings.meta.json"


def main() -> None:
    try:
        import kagglehub
    except ModuleNotFoundError as exc:
        raise SystemExit("Missing dependency: kagglehub. Install it with `python -m pip install kagglehub`.") from exc

    dataset_path = Path(kagglehub.dataset_download(DATASET))
    RAW_DIR.parent.mkdir(parents=True, exist_ok=True)
    if RAW_DIR.exists():
        shutil.rmtree(RAW_DIR)
    shutil.copytree(dataset_path, RAW_DIR)

    current = pd.read_csv(RAW_DIR / "current_nba_players.csv")
    all_time = pd.read_csv(RAW_DIR / "all_time_nba_players.csv")

    keep = [
        "name",
        "team",
        "position_1",
        "position_2",
        "overall",
        "potential",
        "years_in_the_nba",
        "nationality_1",
        "nationality_2",
        "archetype",
        "height_cm",
        "weight_kg",
    ]
    current = current[keep].copy()
    current["dataset_group"] = "current"
    all_time = all_time[keep].copy()
    all_time["dataset_group"] = "all_time"

    df = pd.concat([current, all_time], ignore_index=True)
    df = df.sort_values(["name", "dataset_group", "potential", "overall"], ascending=[True, False, False, False])
    df = df.drop_duplicates(["name", "dataset_group"], keep="first")
    df = df.sort_values(["dataset_group", "potential", "overall", "name"], ascending=[False, False, False, True]).reset_index(drop=True)

    rename = {
        "name": "player_name",
        "position_1": "primary_position",
        "position_2": "secondary_position",
        "years_in_the_nba": "years_in_nba",
    }
    df = df.rename(columns=rename)
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
    OUT_JSON.write_text(
        json.dumps({"players": json.loads(df.to_json(orient="records", force_ascii=False))}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_dataset": DATASET,
        "source_url": "https://www.kaggle.com/datasets/reinerjasin/nba-2k25-player-complete-dataset",
        "outputs": [str(OUT_CSV.relative_to(ROOT)), str(OUT_JSON.relative_to(ROOT))],
        "row_count": int(len(df)),
        "current_player_count": int((df["dataset_group"] == "current").sum()),
        "all_time_player_count": int((df["dataset_group"] == "all_time").sum()),
        "fields_used_for_game": ["overall", "potential"],
    }
    META_JSON.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"wrote {OUT_CSV}")
    print(f"wrote {OUT_JSON}")
    print(f"rows={len(df)} current={(df['dataset_group'] == 'current').sum()} all_time={(df['dataset_group'] == 'all_time').sum()}")


if __name__ == "__main__":
    main()
