#!/usr/bin/env python3
"""Build a local NBA player-season five-stat dataset.

Source dataset:
https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


DATASET = "sumitrodatta/nba-aba-baa-stats"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw" / "nba-aba-baa-stats"

OUTPUT_CSV = DATA_DIR / "nba_player_season_five_stats.csv"
OUTPUT_JSON = DATA_DIR / "nba_player_season_five_stats.json"
COMPLETE_CSV = DATA_DIR / "nba_player_season_five_stats_complete_1974_present.csv"
COMPLETE_JSON = DATA_DIR / "nba_player_season_five_stats_complete_1974_present.json"
META_JSON = DATA_DIR / "nba_player_season_five_stats.meta.json"


def download_dataset() -> Path:
    try:
        import kagglehub
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing dependency: kagglehub. Install it with `python -m pip install kagglehub`."
        ) from exc

    dataset_path = Path(kagglehub.dataset_download(DATASET))
    RAW_DIR.parent.mkdir(parents=True, exist_ok=True)
    if RAW_DIR.exists():
        shutil.rmtree(RAW_DIR)
    shutil.copytree(dataset_path, RAW_DIR)
    return RAW_DIR


def load_and_normalize(raw_dir: Path) -> pd.DataFrame:
    source_file = raw_dir / "Player Per Game.csv"
    df = pd.read_csv(source_file)

    # Keep NBA seasons plus BAA predecessor seasons. ABA-only seasons are excluded.
    df = df[df["lg"].isin(["NBA", "BAA"])].copy()

    needed = [
        "season",
        "lg",
        "player",
        "player_id",
        "age",
        "team",
        "pos",
        "g",
        "pts_per_game",
        "trb_per_game",
        "ast_per_game",
        "stl_per_game",
        "blk_per_game",
    ]
    df = df[needed].rename(
        columns={
            "lg": "league",
            "player": "player_name",
            "pos": "position",
            "g": "games_played",
            "pts_per_game": "points_per_game",
            "trb_per_game": "rebounds_per_game",
            "ast_per_game": "assists_per_game",
            "stl_per_game": "steals_per_game",
            "blk_per_game": "blocks_per_game",
        }
    )

    # Basketball-reference style data includes team rows and a TOT row for traded players.
    # Use the TOT row when present so each player-season appears once.
    df["team_priority"] = (df["team"] == "TOT").astype(int)
    df = (
        df.sort_values(["season", "player_id", "team_priority", "games_played"])
        .drop_duplicates(["season", "player_id"], keep="last")
        .drop(columns=["team_priority"])
    )

    numeric_cols = [
        "season",
        "age",
        "games_played",
        "points_per_game",
        "rebounds_per_game",
        "assists_per_game",
        "steals_per_game",
        "blocks_per_game",
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    int_cols = ["season", "age", "games_played"]
    for col in int_cols:
        df[col] = df[col].astype("Int64")

    df = df.sort_values(["season", "player_name", "player_id"]).reset_index(drop=True)
    return df


def write_outputs(df: pd.DataFrame, raw_dir: Path) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    records = json.loads(df.to_json(orient="records", force_ascii=False))
    OUTPUT_JSON.write_text(
        json.dumps({"players": records}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    stat_fields = [
        "points_per_game",
        "rebounds_per_game",
        "assists_per_game",
        "steals_per_game",
        "blocks_per_game",
    ]
    complete_df = df.dropna(subset=stat_fields).copy()
    complete_df.to_csv(COMPLETE_CSV, index=False, encoding="utf-8-sig")
    complete_records = json.loads(complete_df.to_json(orient="records", force_ascii=False))
    COMPLETE_JSON.write_text(
        json.dumps({"players": complete_records}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    seasons = df["season"].dropna().astype(int)
    complete_seasons = complete_df["season"].dropna().astype(int)
    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_dataset": DATASET,
        "source_url": "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats",
        "raw_copy": str(raw_dir.relative_to(ROOT)),
        "outputs": [
            str(OUTPUT_CSV.relative_to(ROOT)),
            str(OUTPUT_JSON.relative_to(ROOT)),
            str(COMPLETE_CSV.relative_to(ROOT)),
            str(COMPLETE_JSON.relative_to(ROOT)),
        ],
        "row_grain": "one row per player per season; TOT row used for traded players",
        "included_leagues": ["NBA", "BAA"],
        "excluded_leagues": ["ABA"],
        "season_min": int(seasons.min()),
        "season_max": int(seasons.max()),
        "season_count": int(seasons.nunique()),
        "row_count": int(len(df)),
        "player_count": int(df["player_id"].nunique()),
        "complete_five_stat_season_min": int(complete_seasons.min()),
        "complete_five_stat_season_max": int(complete_seasons.max()),
        "complete_five_stat_row_count": int(len(complete_df)),
        "stat_fields": stat_fields,
        "note": "Steals and blocks were not officially tracked before 1973-74, so early rows keep those fields blank.",
    }
    META_JSON.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    raw_dir = download_dataset()
    df = load_and_normalize(raw_dir)
    write_outputs(df, raw_dir)
    print(f"rows={len(df)}")
    print(f"players={df['player_id'].nunique()}")
    print(f"seasons={int(df['season'].min())}-{int(df['season'].max())}")
    print(f"csv={OUTPUT_CSV}")
    print(f"json={OUTPUT_JSON}")


if __name__ == "__main__":
    main()
