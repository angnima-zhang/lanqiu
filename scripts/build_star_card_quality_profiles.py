#!/usr/bin/env python3
"""Build curated star-card quality eligibility for 100 NBA stars."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "nba-aba-baa-stats"
OUT_JSON = ROOT / "data" / "star_card_quality_profiles.json"
OUT_CSV = ROOT / "data" / "star_card_quality_profiles.csv"


QUALITY = {
    3: "新秀",
    4: "饮水机",
    5: "轮换",
    6: "第六人",
    7: "首发",
    8: "核心",
    9: "全明星",
    10: "最佳阵容",
    11: "MVP",
    12: "FMVP",
    13: "名人堂",
    14: "传奇",
    15: "GOAT",
}


# The official NBA 75th Anniversary Team has 76 players because of a voting tie.
NBA75_PLAYERS = [
    "Kareem Abdul-Jabbar",
    "Ray Allen",
    "Giannis Antetokounmpo",
    "Carmelo Anthony",
    "Nate Archibald",
    "Paul Arizin",
    "Charles Barkley",
    "Rick Barry",
    "Elgin Baylor",
    "Dave Bing",
    "Larry Bird",
    "Kobe Bryant",
    "Wilt Chamberlain",
    "Bob Cousy",
    "Dave Cowens",
    "Billy Cunningham",
    "Stephen Curry",
    "Anthony Davis",
    "Dave DeBusschere",
    "Clyde Drexler",
    "Tim Duncan",
    "Kevin Durant",
    "Julius Erving",
    "Patrick Ewing",
    "Walt Frazier",
    "Kevin Garnett",
    "George Gervin",
    "Hal Greer",
    "James Harden",
    "John Havlicek",
    "Elvin Hayes",
    "Allen Iverson",
    "LeBron James",
    "Magic Johnson",
    "Sam Jones",
    "Michael Jordan",
    "Jason Kidd",
    "Kawhi Leonard",
    "Damian Lillard",
    "Jerry Lucas",
    "Karl Malone",
    "Moses Malone",
    "Pete Maravich",
    "Bob McAdoo",
    "Kevin McHale",
    "George Mikan",
    "Reggie Miller",
    "Earl Monroe",
    "Steve Nash",
    "Dirk Nowitzki",
    "Hakeem Olajuwon",
    "Shaquille O'Neal",
    "Robert Parish",
    "Chris Paul",
    "Gary Payton",
    "Bob Pettit",
    "Paul Pierce",
    "Scottie Pippen",
    "Willis Reed",
    "Oscar Robertson",
    "David Robinson",
    "Dennis Rodman",
    "Bill Russell",
    "Dolph Schayes",
    "Bill Sharman",
    "John Stockton",
    "Isiah Thomas",
    "Nate Thurmond",
    "Wes Unseld",
    "Dwyane Wade",
    "Bill Walton",
    "Jerry West",
    "Russell Westbrook",
    "Lenny Wilkens",
    "Dominique Wilkins",
    "James Worthy",
]


# 24 extras plus the 76 official entries gives exactly 100 curated stars.
EXTRA_STARS = {
    "Dwight Howard": "落选官方75大；8次全明星、8次最佳阵容、3次DPOY级内线",
    "Nikola Jokic": "落选官方75大；多次MVP、FMVP、当代顶级中锋",
    "Luka Doncic": "落选官方75大；多次最佳阵容、当代持球核心",
    "Joel Embiid": "落选官方75大；MVP、得分王级中锋",
    "Tracy McGrady": "落选官方75大；名人堂、得分王、巅峰外线核心",
    "Vince Carter": "落选官方75大；名人堂、8次全明星、超长生涯",
    "Pau Gasol": "落选官方75大；名人堂、冠军核心内线",
    "Tony Parker": "落选官方75大；名人堂、FMVP、冠军后卫",
    "Manu Ginobili": "落选官方75大；名人堂、第六人代表、冠军后卫",
    "Chris Bosh": "落选官方75大；名人堂、冠军核心内线",
    "Yao Ming": "落选官方75大；名人堂、国际影响力中锋",
    "Alonzo Mourning": "落选官方75大；名人堂、DPOY级中锋",
    "Dikembe Mutombo": "落选官方75大；名人堂、历史级防守中锋",
    "Ben Wallace": "落选官方75大；名人堂、DPOY级冠军中锋",
    "Grant Hill": "落选官方75大；名人堂、巅峰全能前锋",
    "Klay Thompson": "落选官方75大；冠军核心、历史级射手",
    "Draymond Green": "落选官方75大；冠军核心、DPOY级组织防守前锋",
    "Kyrie Irving": "落选官方75大；冠军核心、顶级单打后卫",
    "Jimmy Butler": "落选官方75大；季后赛核心、攻防领袖",
    "Paul George": "落选官方75大；多次最佳阵容、攻防核心",
    "Blake Griffin": "落选官方75大；多次全明星、最佳阵容前锋",
    "LaMarcus Aldridge": "落选官方75大；多次全明星、最佳阵容内线",
    "Alex English": "落选官方75大；名人堂、得分王级锋线",
    "Chris Webber": "落选官方75大；名人堂、国王时代核心内线",
}

CHINESE_NATIONAL_PLAYERS = {
    "Yao Ming": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Wang Zhizhi": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Mengke Bateer": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Yi Jianlian": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Sun Yue": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Zhou Qi": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Cui Yongxi": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Yang Hansen": "中国籍球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
    "Kyle Anderson": "中国籍归化球员特例；开发者私心：开放新秀及以上所有品质，GOAT属性全满",
}

GOAT_FULL_ATTRIBUTES = {
    "scoring": 1000,
    "rebound": 550,
    "assist": 300,
    "steal": 110,
    "block": 170,
}


ALIASES = {
    "Nate Archibald": "Tiny Archibald",
}

FMVP_WINNERS = {
    "Kareem Abdul-Jabbar",
    "Rick Barry",
    "Larry Bird",
    "Kobe Bryant",
    "John Havlicek",
    "LeBron James",
    "Magic Johnson",
    "Michael Jordan",
    "Kawhi Leonard",
    "Moses Malone",
    "Kevin Durant",
    "Hakeem Olajuwon",
    "Shaquille O'Neal",
    "Tim Duncan",
    "Dwyane Wade",
    "Bill Walton",
    "Jerry West",
    "Willis Reed",
    "Isiah Thomas",
    "James Worthy",
    "Dirk Nowitzki",
    "Paul Pierce",
    "Giannis Antetokounmpo",
    "Stephen Curry",
    "Nikola Jokic",
    "Tony Parker",
}

GOAT_PLAYERS = {"Michael Jordan", "LeBron James"}

LEGEND_PLAYERS = {
    "Kareem Abdul-Jabbar",
    "Larry Bird",
    "Kobe Bryant",
    "Wilt Chamberlain",
    "Stephen Curry",
    "Tim Duncan",
    "Julius Erving",
    "Magic Johnson",
    "Michael Jordan",
    "LeBron James",
    "Dirk Nowitzki",
    "Hakeem Olajuwon",
    "Shaquille O'Neal",
    "Oscar Robertson",
    "Bill Russell",
    "Jerry West",
    "Nikola Jokic",
}

MANUAL_SIXTH_MAN = {
    "John Havlicek": "早年凯尔特人第六人代表",
}


def norm_name(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value))
    text = text.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def winner_mask(df: pd.DataFrame) -> pd.Series:
    return df["winner"].astype(str).str.lower().isin(["true", "1", "yes"])


def main() -> None:
    career = pd.read_csv(RAW_DIR / "Player Career Info.csv")
    awards = pd.read_csv(RAW_DIR / "Player Award Shares.csv")
    teams = pd.read_csv(RAW_DIR / "End of Season Teams.csv")
    all_star = pd.read_csv(RAW_DIR / "All-Star Selections.csv")
    per_game = pd.read_csv(RAW_DIR / "Player Per Game.csv")

    career_by_norm = {norm_name(row.player): row for row in career.itertuples(index=False)}

    official_set = set(NBA75_PLAYERS)
    base_star_names = NBA75_PLAYERS + list(EXTRA_STARS.keys())
    if len(base_star_names) != 100:
        raise RuntimeError(f"Expected 100 selected stars, got {len(base_star_names)}")
    selected_names = base_star_names + [
        name for name in CHINESE_NATIONAL_PLAYERS if name not in base_star_names
    ]

    rows = []
    for order, display_name in enumerate(selected_names, start=1):
        data_name = ALIASES.get(display_name, display_name)
        key = norm_name(data_name)
        if key not in career_by_norm:
            raise RuntimeError(f"Could not match player in source data: {display_name}")

        career_row = career_by_norm[key]
        player_id = career_row.player_id
        source_name = career_row.player

        player_awards = awards[awards["player_id"].eq(player_id)]
        player_teams = teams[teams["player_id"].eq(player_id)]
        player_all_star = all_star[all_star["player_id"].eq(player_id)]
        player_seasons = per_game[per_game["player_id"].eq(player_id)]

        is_chinese_special = display_name in CHINESE_NATIONAL_PLAYERS
        mvp_wins = player_awards[
            player_awards["award"].isin(["nba mvp", "aba mvp"]) & winner_mask(player_awards)
        ]["season"].astype(int).tolist()
        smoy_wins = player_awards[
            player_awards["award"].eq("nba smoy") & winner_mask(player_awards)
        ]["season"].astype(int).tolist()

        all_nba_rows = player_teams[
            player_teams["type"].isin(["All-NBA", "All-ABA", "All-BAA"])
        ]
        all_nba_count = int(len(all_nba_rows))
        all_star_count = int(len(player_all_star))

        peak_ppg = float(player_seasons["pts_per_game"].max()) if len(player_seasons) else 0.0
        from_season = int(getattr(career_row, "_7"))
        to_season = int(career_row.to)
        seasons_played = int(to_season - from_season + 1)
        is_official_75 = display_name in official_set
        is_hof = bool(career_row.hof) or is_official_75 or is_chinese_special
        is_legend = display_name in LEGEND_PLAYERS or is_chinese_special
        is_goat = display_name in GOAT_PLAYERS or is_chinese_special
        has_fmvp = display_name in FMVP_WINNERS
        has_sixth_man = bool(smoy_wins) or display_name in MANUAL_SIXTH_MAN

        levels = {3}
        basis = {3: "所有入选球星都保留新秀卡"}

        if is_chinese_special:
            levels = set(QUALITY)
            basis = {
                level: CHINESE_NATIONAL_PLAYERS[display_name]
                for level in levels
            }
        elif has_sixth_man:
            levels.add(6)
            basis[6] = (
                f"年度最佳第六人赛季: {', '.join(map(str, smoy_wins))}"
                if smoy_wins
                else MANUAL_SIXTH_MAN[display_name]
            )

        if not is_chinese_special:
            # This curated list is intentionally star-only, so every player has at least
            # starter and core cards. Low bench tiers are not backfilled automatically.
            levels.update([7, 8])
            basis[7] = "入选百大球星池，具备首发级履历"
            basis[8] = "入选百大球星池，具备球队核心级履历"

            if all_star_count > 0 or is_official_75:
                levels.add(9)
                basis[9] = f"全明星入选次数: {all_star_count}" if all_star_count else "官方75大球星"
            if all_nba_count > 0:
                levels.add(10)
                basis[10] = f"最佳阵容/ABA/BAA阵容次数: {all_nba_count}"
            if mvp_wins:
                levels.add(11)
                basis[11] = f"MVP赛季: {', '.join(map(str, mvp_wins))}"
            if has_fmvp:
                levels.add(12)
                basis[12] = "获得过总决赛MVP"
            if is_hof:
                levels.add(13)
                basis[13] = "官方75大或名人堂履历"
            if is_legend:
                levels.add(14)
                basis[14] = "历史顶级/队史图腾级球星"
            if is_goat:
                levels.add(15)
                basis[15] = "GOAT候选级历史地位"

        levels_sorted = sorted(levels)
        source_group = "NBA75" if is_official_75 else "Extra24"
        if is_chinese_special:
            source_group = f"{source_group}+ChinaSpecial" if display_name in base_star_names else "ChinaSpecial"
        rows.append(
            {
                "rank": order,
                "display_name": display_name,
                "source_player_name": source_name,
                "player_id": player_id,
                "source_group": source_group,
                "is_official_75": is_official_75,
                "extra_reason": (
                    CHINESE_NATIONAL_PLAYERS[display_name]
                    if is_chinese_special and display_name not in EXTRA_STARS
                    else "" if is_official_75
                    else EXTRA_STARS[display_name]
                ),
                "is_chinese_national_special": is_chinese_special,
                "from_season": from_season,
                "to_season": to_season,
                "seasons_played": seasons_played,
                "peak_points_per_game": round(peak_ppg, 1),
                "all_star_count": all_star_count,
                "all_nba_count": all_nba_count,
                "mvp_seasons": mvp_wins,
                "has_fmvp": has_fmvp,
                "has_sixth_man": has_sixth_man,
                "is_hall_of_fame_quality": is_hof,
                "is_legend_quality": is_legend,
                "is_goat_quality": is_goat,
                "quality_levels": levels_sorted,
                "quality_names": [QUALITY[level] for level in levels_sorted],
                "quality_basis": {QUALITY[level]: basis[level] for level in levels_sorted},
                "goat_attribute_override": GOAT_FULL_ATTRIBUTES if is_chinese_special else None,
            }
        )

    OUT_JSON.write_text(
        json.dumps(
            {
                "_meta": {
                    "version": "1.0",
                    "description": "100-player curated star-card quality eligibility table",
                    "source_dataset": "sumitrodatta/nba-aba-baa-stats",
                    "source_dataset_url": "https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats",
                    "official_75_source_url": "https://www.nba.com/news/nba-75th-anniversary-team-announced",
                    "official_75_note": "NBA 75th Anniversary Team has 76 players because of a voting tie; this file uses those 76 plus 24 extras.",
                    "base_star_count": len(base_star_names),
                    "chinese_national_special_count": len(CHINESE_NATIONAL_PLAYERS),
                    "chinese_national_special_note": "Chinese-national players are developer-favor exceptions: every remaining quality level from rookie upward is enabled and GOAT cards use full five-stat attributes.",
                    "goat_full_attribute_override": GOAT_FULL_ATTRIBUTES,
                    "quality_scale": QUALITY,
                    "rule_note": "All selected stars get rookie, starter, and core cards. Sixth-man cards are only added for real sixth-man history. Award tiers are driven by recorded awards/teams plus a small manual FMVP/legend set. Chinese-national special players override the normal rule.",
                    "count": len(rows),
                },
                "players": rows,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    flat_rows = []
    for row in rows:
        flat = row.copy()
        flat["mvp_seasons"] = "|".join(map(str, row["mvp_seasons"]))
        flat["quality_levels"] = "|".join(map(str, row["quality_levels"]))
        flat["quality_names"] = "|".join(row["quality_names"])
        flat["quality_basis"] = json.dumps(row["quality_basis"], ensure_ascii=False)
        flat["goat_attribute_override"] = (
            json.dumps(row["goat_attribute_override"], ensure_ascii=False)
            if row["goat_attribute_override"]
            else ""
        )
        flat_rows.append(flat)
    pd.DataFrame(flat_rows).to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    print(f"wrote {OUT_JSON}")
    print(f"wrote {OUT_CSV}")
    print(f"players={len(rows)} nba75={sum(r['is_official_75'] for r in rows)} extras={sum(not r['is_official_75'] for r in rows)} chinese_special={sum(r['is_chinese_national_special'] for r in rows)}")


if __name__ == "__main__":
    main()
