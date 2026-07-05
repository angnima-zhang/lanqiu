from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

from nba_api.stats.static import players as nba_players

sys.stdout.reconfigure(encoding="utf-8")


ROOT = Path(__file__).resolve().parents[1]
ROSTER = ROOT / "data" / "player_config_fame_v3.json"
OUTPUT = ROOT / "headshots_official"
MANIFEST = OUTPUT / "manifest.csv"
NBA_CDN = "https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
NBA_OFFICIAL_PLACEHOLDER_SHA256 = "e366885fc4212e3a4100f49ed48ad866fd05b32e2d25898c2c24205e789e2632"

NBA_ID_OVERRIDES = {
    "Cui Yongxi": 1642385,
    "Jimmy Butler": 202710,
    "Louie Dampier": 76499,
}

CBA_PLAYER_IDS = {
    "丁彦雨航": 907914,
    "吴前": 907828,
    "胡明轩": 100002137,
    "阿不都沙拉木": 907927,
    "王哲林": 679408,
    "胡金秋": 907950,
    "贺希宁": 907766,
    "赵继伟": 907994,
}

CBA_NBA_ALIASES = {
    "巴特尔": "Mengke_Bateer.jpg",
    "姚明": "Yao_Ming.png",
    "易建联": "Yi_Jianlian.png",
    "王治郅": "Wang_Zhizhi.jpg",
}

CBA_CDN = "https://cbaleague.oss-cn-beijing.aliyuncs.com/playerheader/2025/{player_id}.jpg"
CBA_PLAYER_URL_OVERRIDES = {
    name: f"https://image.cbaleague.com/cbaleague/playerheaders/{player_id}.jpg"
    for name, player_id in CBA_PLAYER_IDS.items()
    if name in {"丁彦雨航", "吴前", "胡明轩", "阿不都沙拉木"}
}

HEADSHOT_SOURCE_OVERRIDES = {
    "Antawn Jamison": {
        "url": "https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/unc.sidearmsports.com/images/2025/8/6/jamison6_HF4Zs.jpg",
        "extension": ".jpg",
        "authority": "北卡罗来纳大学体育部",
    },
    "Arvydas Sabonis": {
        "url": "https://www.hoophall.com/application/files/1817/6487/8819/sabonis_arvydas_headshot.webp",
        "extension": ".webp",
        "authority": "Naismith Memorial Basketball Hall of Fame",
    },
    "Greg Oden": {
        "url": "https://cdn.nba.com/manage/2020/10/Greg20Oden20iso20bench20heat-scaled.jpg",
        "extension": ".jpg",
        "authority": "NBA",
    },
    "Jason Kidd": {
        "url": "https://www.hoophall.com/application/files/4517/6487/8792/kidd.webp",
        "extension": ".webp",
        "authority": "Naismith Memorial Basketball Hall of Fame",
    },
    "Mengke Bateer": {
        "url": "https://bkimg.cdn.bcebos.com/pic/6a600c338744ebf81a4c9023a8a0c02a6059252d092f",
        "extension": ".jpg",
        "authority": "百度百科人物资料页",
    },
    "Patrick Ewing": {
        "url": "https://www.hoophall.com/application/files/7117/6487/8766/ewing_patrick_headshot.webp",
        "extension": ".webp",
        "authority": "Naismith Memorial Basketball Hall of Fame",
    },
    "Sun Yue": {
        "url": "https://news.cgtn.com/news/2021-10-16/Sun-Yue-announces-retirement-from-basketball-14pZjKRxj3q/img/2f4d127858ce413db5b64005b4254fcd/2f4d127858ce413db5b64005b4254fcd.jpeg",
        "extension": ".jpg",
        "authority": "CGTN",
    },
    "Wang Zhizhi": {
        "url": "http://assets.fiba.basketball/image/upload/f_auto/q_auto/v1775636508/lcjfek38nizau0fpxnqe.png",
        "extension": ".jpg",
        "authority": "FIBA Hall of Fame",
    },
    "刘玉栋": {
        "url": "http://www.news.cn/sports/20240118/65e5b124990d4c7fb2e2c67349434ba2/2024011865e5b124990d4c7fb2e2c67349434ba2_1fbef1764f2e46e786af59955da6bd21.jpg",
        "extension": ".jpg",
        "authority": "新华社",
    },
    "唐正东": {
        "url": "https://cdn.tongxiclub.com/wp-content/uploads/2016/08/443f3eebc590b4f.jpg",
        "extension": ".jpg",
        "authority": "南京同曦篮球俱乐部",
    },
    "孙军": {
        "url": "http://www.news.cn/sports/20250304/a3266665cb4945f2bb1eb30924f06ca5/20250304a3266665cb4945f2bb1eb30924f06ca5_c3202a4f9486407dba6d5694a2499b99.jpeg",
        "extension": ".jpg",
        "authority": "新华社",
    },
    "巩晓彬": {
        "url": "https://img12.iqilu.com/1/extraction/202503/24/563e2385f14a419fa5bf0fef75e297eb-1.jpg",
        "extension": ".jpg",
        "authority": "闪电体育 / 齐鲁网",
    },
    "杜锋": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/be/Du_Feng_-_Beijing_2008_Olympics_%282752067735%29_%28cropped%29.jpg",
        "extension": ".jpg",
        "authority": "Wikimedia Commons / Beijing 2008",
    },
    "王仕鹏": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Wang_Shipeng_-_Beijing_2008_Olympics_%282752109255%29_%28cropped%29.jpg",
        "extension": ".jpg",
        "authority": "Wikimedia Commons / Beijing 2008",
    },
    "朱芳雨": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Zhu_Fangyu_-_Beijing_2008_Olympic_Games_%282751889351%29_%28cropped%29.jpg",
        "extension": ".jpg",
        "authority": "Wikimedia Commons / Beijing 2008",
    },
    "胡卫东": {
        "url": "http://i3.sinaimg.cn/ty/star/huweidong/U338P6T111D241F2437DT20030408140721.jpg",
        "extension": ".jpg",
        "authority": "新浪体育球星资料库",
    },
}


def normalized_name(value: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", ascii_name.lower())


def safe_filename(value: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", value).replace(" ", "_")


def is_nba_official_placeholder(content: bytes) -> bool:
    return hashlib.sha256(content).hexdigest() == NBA_OFFICIAL_PLACEHOLDER_SHA256


def is_image(content: bytes) -> bool:
    return len(content) > 4_000 and (
        content.startswith(b"\xff\xd8\xff")
        or content.startswith(b"\x89PNG\r\n\x1a\n")
        or content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    )


def main() -> None:
    roster = json.loads(ROSTER.read_text(encoding="utf-8-sig"))["players"]
    unique = {row["sourcePlayerName"]: row for row in roster}
    previous_manifest = {}
    if MANIFEST.exists():
        with MANIFEST.open(encoding="utf-8-sig", newline="") as handle:
            previous_manifest = {
                row["sourcePlayerName"]: row for row in csv.DictReader(handle)
            }
    official_players = {
        normalized_name(row["full_name"]): row for row in nba_players.get_players()
    }

    OUTPUT.mkdir(exist_ok=True)
    manifest_rows = []

    for name, row in sorted(unique.items()):
        if name in HEADSHOT_SOURCE_OVERRIDES:
            override = HEADSHOT_SOURCE_OVERRIDES[name]
            source_url = override["url"]
            target = OUTPUT / f"{safe_filename(name)}{override['extension']}"
            existing = target.read_bytes() if target.exists() else b""
            status = "verified_authority_photo" if is_image(existing) else "download_failed"
            if status == "download_failed":
                request = urllib.request.Request(
                    source_url,
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                try:
                    with urllib.request.urlopen(request, timeout=30) as response:
                        content = response.read()
                    if is_image(content):
                        target.write_bytes(content)
                        status = "verified_authority_photo"
                    else:
                        status = "invalid_image"
                except (urllib.error.URLError, TimeoutError):
                    status = "download_failed"
            manifest_rows.append(
                {
                    "sourcePlayerName": name,
                    "sourceLeague": row.get("sourceLeague", ""),
                    "officialPlayerId": "",
                    "status": status,
                    "file": target.name if status == "verified_authority_photo" else "",
                    "sourceUrl": source_url,
                    "sourceAuthority": override["authority"],
                    "verificationNote": "人工核验为球员本人真实照片",
                }
            )
            print(f"{status:28} {name}")
            continue

        if row.get("sourceLeague") == "CBA":
            if name in CBA_NBA_ALIASES:
                source_file = OUTPUT / CBA_NBA_ALIASES[name]
                target = OUTPUT / f"{safe_filename(name)}{source_file.suffix}"
                previous = previous_manifest.get(name, {})
                if (
                    previous.get("status") == "official_placeholder_not_portrait"
                    and not source_file.exists()
                ):
                    status = "official_placeholder_not_portrait"
                    source_url = previous.get("sourceUrl", "")
                    official_id = previous.get("officialPlayerId", "")
                elif source_file.exists():
                    shutil.copyfile(source_file, target)
                    status = (
                        "official_placeholder_not_portrait"
                        if is_nba_official_placeholder(target.read_bytes())
                        else "copied_nba_official_alias"
                    )
                    source_url = next(
                        item["sourceUrl"]
                        for item in manifest_rows
                        if item["file"] == source_file.name
                        or f"{safe_filename(item['sourcePlayerName'])}.png" == source_file.name
                    )
                    official_id = source_url.rsplit("/", 1)[-1].removesuffix(".png")
                else:
                    status = "nba_alias_source_missing"
                    source_url = ""
                    official_id = ""
            elif name in CBA_PLAYER_IDS:
                official_id = CBA_PLAYER_IDS[name]
                source_url = CBA_PLAYER_URL_OVERRIDES.get(
                    name, CBA_CDN.format(player_id=official_id)
                )
                target = OUTPUT / f"{safe_filename(name)}.jpg"
                request = urllib.request.Request(
                    source_url,
                    headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.cbaleague.com/"},
                )
                try:
                    with urllib.request.urlopen(request, timeout=30) as response:
                        content = response.read()
                    if content.startswith(b"\xff\xd8\xff") and len(content) > 5_000:
                        target.write_bytes(content)
                        status = "downloaded_cba_official"
                    else:
                        status = "invalid_cba_image"
                except (urllib.error.URLError, TimeoutError):
                    status = "download_failed"
            else:
                official_id = ""
                source_url = ""
                target = OUTPUT / f"{safe_filename(name)}.jpg"
                status = "pending_official_cba_source"

            manifest_rows.append(
                {
                    "sourcePlayerName": name,
                    "sourceLeague": row.get("sourceLeague", ""),
                    "officialPlayerId": official_id,
                    "status": status,
                    "file": target.name if status in {"copied_nba_official_alias", "downloaded_cba_official"} else "",
                    "sourceUrl": source_url,
                    "sourceAuthority": "NBA" if name in CBA_NBA_ALIASES else "CBA",
                    "verificationNote": "同一球员别名复用" if name in CBA_NBA_ALIASES else "官方球员头像",
                }
            )
            print(f"{status:28} {name}")
            continue

        match = official_players.get(normalized_name(name))
        player_id = NBA_ID_OVERRIDES.get(name) or (match["id"] if match else None)
        source_url = NBA_CDN.format(player_id=player_id) if player_id else ""
        target = OUTPUT / f"{safe_filename(name)}.png"
        status = "missing_official_id"
        previous = previous_manifest.get(name, {})

        if (
            previous.get("status") == "official_placeholder_not_portrait"
            and not target.exists()
        ):
            status = "official_placeholder_not_portrait"
        elif player_id:
            existing = target.read_bytes() if target.exists() else b""
            if existing.startswith(b"\x89PNG\r\n\x1a\n") and len(existing) > 5_000:
                status = "downloaded"
            else:
                request = urllib.request.Request(
                    source_url,
                    headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.nba.com/"},
                )
                try:
                    with urllib.request.urlopen(request, timeout=30) as response:
                        content = response.read()
                    if content.startswith(b"\x89PNG\r\n\x1a\n") and len(content) > 5_000:
                        target.write_bytes(content)
                        status = "downloaded"
                    else:
                        status = "invalid_image"
                except (urllib.error.URLError, TimeoutError):
                    status = "download_failed"
            if status == "downloaded" and is_nba_official_placeholder(target.read_bytes()):
                status = "official_placeholder_not_portrait"

        manifest_rows.append(
            {
                "sourcePlayerName": name,
                "sourceLeague": row.get("sourceLeague", ""),
                "officialPlayerId": player_id or "",
                "status": status,
                "file": target.name if status == "downloaded" else "",
                "sourceUrl": source_url,
                "sourceAuthority": "NBA",
                "verificationNote": "NBA官方球员头像",
            }
        )
        print(f"{status:28} {name}")

    with MANIFEST.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=manifest_rows[0].keys())
        writer.writeheader()
        writer.writerows(manifest_rows)

    counts = {}
    for row in manifest_rows:
        counts[row["status"]] = counts.get(row["status"], 0) + 1
    print(json.dumps(counts, ensure_ascii=False, indent=2))
    print(MANIFEST)


if __name__ == "__main__":
    main()
