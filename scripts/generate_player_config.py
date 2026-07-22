#!/usr/bin/env python3
"""Generate real-NBA-player card config for every game quality."""

from __future__ import annotations

import argparse
import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT_JSON = DATA / "player_config.json"
OUT_CSV = DATA / "player_config.csv"
ALLTIME_OUT_JSON = DATA / "player_config_alltime_v2.json"
ALLTIME_OUT_CSV = DATA / "player_config_alltime_v2.csv"
FAME_OUT_JSON = DATA / "player_config_fame_v3.json"
FAME_OUT_CSV = DATA / "player_config_fame_v3.csv"
ALLTIME_REFERENCE = DATA / "nba2k_alltime_teams.md"

QUALITY_NAMES = {
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

RANGES = {
    3: (50, 180, 30, 90, 20, 50, 0, 20, 0, 20),
    4: (100, 280, 50, 140, 30, 80, 10, 30, 10, 30),
    5: (180, 400, 80, 200, 50, 120, 10, 40, 10, 50),
    6: (280, 520, 120, 260, 70, 160, 20, 60, 20, 70),
    7: (380, 650, 160, 320, 100, 200, 30, 70, 30, 90),
    8: (480, 750, 200, 380, 130, 230, 40, 80, 40, 110),
    9: (580, 850, 250, 430, 160, 260, 50, 90, 50, 130),
    10: (680, 920, 300, 470, 190, 280, 60, 100, 60, 150),
    11: (780, 970, 350, 510, 220, 290, 70, 100, 70, 160),
    12: (850, 990, 400, 530, 240, 300, 80, 110, 80, 170),
    13: (900, 1000, 450, 550, 260, 300, 90, 110, 90, 170),
    14: (950, 1000, 500, 550, 280, 300, 100, 110, 100, 170),
    15: (980, 1000, 530, 550, 290, 300, 100, 110, 150, 170),
}

GOAT_FULL_ATTRIBUTES = {
    "scoring": 1000,
    "rebound": 550,
    "assist": 300,
    "steal": 110,
    "block": 170,
}

CHINESE_NAME_BY_PLAYER = {
    "Yao Ming": "姚明",
    "Wang Zhizhi": "王治郅",
    "Mengke Bateer": "巴特尔",
    "Yi Jianlian": "易建联",
    "Sun Yue": "孙悦",
    "Zhou Qi": "周琦",
    "Cui Yongxi": "崔永熙",
    "Yang Hansen": "杨瀚森",
    "Kyle Anderson": "李凯尔",
}

# Approved in-game names are taken from the Chinese prefix of the matching
# avatar filename under 篮球CocosProject/assets/resources/images/头像.
DISPLAY_NAME_OVERRIDES = {
    "Amar'e Stoudemire": "司塔德迈尔",
    "Antawn Jamison": "假米森",
    "Anthony Edwards": "爱得划兹",
    "Chauncey Billups": "比炉普斯",
    "Chris Mullin": "木林",
    "Cui Yongxi": "崔勇熙",
    "DeMarcus Cousins": "烤辛斯",
    "Dylan Harper": "哈魄",
    "Greg Oden": "傲登",
    "J.R. Smith": "JR史秘司",
    "James Harden": "哈灯",
    "Joe Dumars": "杜码斯",
    "John Wall": "我尔",
    "Kevin Johnson": "越翰逊",
    "Kobe Bryant": "颗比",
    "Magic Johnson": "魔术师",
    "Patrick Ewing": "游因",
    "Rajon Rondo": "胧多",
    "Russell Westbrook": "维司布鲁克",
    "Shai Gilgeous-Alexander": "鸭梨山大",
    "Toni Kukoč": "库颗奇",
    "Tracy McGrady": "卖迪",
    "Tyrese Haliburton": "哈里搏顿",
    "Victor Wembanyama": "文般亚玛",
    "Vlade Divac": "迪瓦慈",
    "Zion Williamson": "锡暗",
    "巩晓彬": "汞小彬",
}

CHINESE_SPECIAL_IDS = set(CHINESE_NAME_BY_PLAYER)

RECENT_ROOKIE_KEEP_NAMES = {
    "Cooper Flagg",
    "Dylan Harper",
    "Kon Knueppel",
    "VJ Edgecombe",
    "Yang Hansen",
    "Cui Yongxi",
    "Stephon Castle",
    "Amen Thompson",
    "Chet Holmgren",
    "Victor Wembanyama",
}

SPECIAL_QUALITY_RULES = {
    "Victor Wembanyama": {
        "include": [3, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        "exclude": [4, 5, 6],
        "reason": "NBA 2K25 potential 99; treated as rookie-to-GOAT ceiling except bench tiers.",
    }
}

SURNAME_CN = {
    "Abdul-Jabbar": "贾巴尔",
    "Adams": "亚当斯",
    "Adebayo": "阿德巴约",
    "Aldridge": "阿尔德里奇",
    "Alexander": "亚历山大",
    "Allen": "阿伦",
    "Anderson": "安德森",
    "Anthony": "安东尼",
    "Antetokounmpo": "阿德托昆博",
    "Archibald": "阿奇博尔德",
    "Arizin": "阿里金",
    "Ayton": "艾顿",
    "Banchero": "班凯罗",
    "Barkley": "巴克利",
    "Barnes": "巴恩斯",
    "Barry": "巴里",
    "Baylor": "贝勒",
    "Beal": "比尔",
    "Bing": "宾",
    "Bird": "伯德",
    "Booker": "布克",
    "Bosh": "波什",
    "Bridges": "布里奇斯",
    "Brown": "布朗",
    "Brunson": "布伦森",
    "Bryant": "布莱恩特",
    "Butler": "巴特勒",
    "Carter": "卡特",
    "Chamberlain": "张伯伦",
    "Cousy": "库西",
    "Cowens": "考恩斯",
    "Cunningham": "坎宁安",
    "Curry": "库里",
    "Dantley": "丹特利",
    "Davis": "戴维斯",
    "DeBusschere": "德布斯切尔",
    "DeRozan": "德罗赞",
    "Doncic": "东契奇",
    "Dončić": "东契奇",
    "Drexler": "德雷克斯勒",
    "Duncan": "邓肯",
    "Durant": "杜兰特",
    "Edwards": "爱德华兹",
    "Embiid": "恩比德",
    "English": "英格利什",
    "Erving": "欧文",
    "Ewing": "尤因",
    "Fox": "福克斯",
    "Flagg": "弗拉格",
    "Frazier": "弗雷泽",
    "Garnett": "加内特",
    "Gasol": "加索尔",
    "George": "乔治",
    "Gervin": "格文",
    "Gilgeous-Alexander": "吉尔杰斯亚历山大",
    "Ginobili": "吉诺比利",
    "Ginóbili": "吉诺比利",
    "Gobert": "戈贝尔",
    "Grant": "格兰特",
    "Green": "格林",
    "Greer": "格里尔",
    "Griffin": "格里芬",
    "Harden": "哈登",
    "Hardaway": "哈达威",
    "Havlicek": "哈夫利切克",
    "Hayes": "海耶斯",
    "Hill": "希尔",
    "Holiday": "霍勒迪",
    "Howard": "霍华德",
    "Ingram": "英格拉姆",
    "Irving": "欧文",
    "Iverson": "艾弗森",
    "Jackson": "杰克逊",
    "James": "詹姆斯",
    "Johnson": "约翰逊",
    "Jokic": "约基奇",
    "Jokić": "约基奇",
    "Jones": "琼斯",
    "Jordan": "乔丹",
    "Kidd": "基德",
    "King": "金",
    "Klay": "汤普森",
    "Kuzma": "库兹马",
    "LaVine": "拉文",
    "Leonard": "伦纳德",
    "Lillard": "利拉德",
    "Love": "乐福",
    "Lowry": "洛瑞",
    "Lucas": "卢卡斯",
    "Malone": "马龙",
    "Maravich": "马拉维奇",
    "Maxey": "马克西",
    "McAdoo": "麦卡杜",
    "McCollum": "麦科勒姆",
    "McGrady": "麦格雷迪",
    "McHale": "麦克海尔",
    "Miller": "米勒",
    "Mitchell": "米切尔",
    "Mobley": "莫布里",
    "Monroe": "门罗",
    "Morant": "莫兰特",
    "Mourning": "莫宁",
    "Mutombo": "穆托姆博",
    "Nash": "纳什",
    "Nowitzki": "诺维茨基",
    "Olajuwon": "奥拉朱旺",
    "O'Neal": "奥尼尔",
    "Parish": "帕里什",
    "Parker": "帕克",
    "Paul": "保罗",
    "Payton": "佩顿",
    "Pettit": "佩蒂特",
    "Pierce": "皮尔斯",
    "Pippen": "皮蓬",
    "Porzingis": "波尔津吉斯",
    "Randle": "兰德尔",
    "Reed": "里德",
    "Robertson": "罗伯特森",
    "Robinson": "罗宾逊",
    "Rodman": "罗德曼",
    "Rose": "罗斯",
    "Russell": "拉塞尔",
    "Sabonis": "萨博尼斯",
    "Schayes": "谢伊斯",
    "Sharman": "沙曼",
    "Siakam": "西亚卡姆",
    "Stockton": "斯托克顿",
    "Tatum": "塔图姆",
    "Thomas": "托马斯",
    "Thompson": "汤普森",
    "Thurmond": "瑟蒙德",
    "Towns": "唐斯",
    "Turner": "特纳",
    "Unseld": "昂塞尔德",
    "Wade": "韦德",
    "Wallace": "华莱士",
    "Walton": "沃顿",
    "Webber": "韦伯",
    "West": "韦斯特",
    "Westbrook": "威斯布鲁克",
    "Wilkens": "威尔肯斯",
    "Wilkins": "威尔金斯",
    "Williams": "威廉姆斯",
    "Worthington": "沃辛顿",
    "Worthy": "沃西",
    "Young": "杨",
}

SURNAME_CN.update({
    "Aldama": "阿尔达马",
    "Arenas": "阿里纳斯",
    "Armstrong": "阿姆斯特朗",
    "Avdija": "阿夫迪亚",
    "Bagley": "巴格利",
    "Bailey": "贝利",
    "Ball": "鲍尔",
    "Bane": "贝恩",
    "Barbosa": "巴博萨",
    "Barrett": "巴雷特",
    "Black": "布莱克",
    "Boucher": "布歇",
    "Braun": "布劳恩",
    "Burks": "伯克斯",
    "Buzelis": "布泽利斯",
    "Caldwell-Pope": "考德威尔波普",
    "Camara": "卡马拉",
    "Castle": "卡斯尔",
    "Chandler": "钱德勒",
    "Clingan": "克林根",
    "Clowney": "克劳尼",
    "Collier": "科利尔",
    "Collins": "柯林斯",
    "Conley": "康利",
    "Coulibaly": "库利巴利",
    "Coward": "考沃德",
    "Crowder": "克劳德",
    "Daniels": "丹尼尔斯",
    "Dick": "迪克",
    "Dosunmu": "多森姆",
    "Drummond": "德拉蒙德",
    "Duarte": "杜阿尔特",
    "Dunn": "邓恩",
    "Duren": "杜伦",
    "Edey": "伊迪",
    "Edgecombe": "埃奇库姆",
    "Fears": "菲尔斯",
    "Filipowski": "菲利波夫斯基",
    "Fultz": "富尔茨",
    "Garland": "加兰",
    "Giddey": "吉迪",
    "Gillespie": "吉莱斯皮",
    "Gordon": "戈登",
    "Grimes": "格莱姆斯",
    "Harper": "哈珀",
    "Harrell": "哈雷尔",
    "Hart": "哈特",
    "Hartenstein": "哈尔滕施泰因",
    "Herro": "希罗",
    "Holmes": "霍姆斯",
    "Holmgren": "霍姆格伦",
    "Ingles": "英格尔斯",
    "Isaac": "艾萨克",
    "Ivey": "艾维",
    "Jaquez": "哈克斯",
    "Kessler": "凯斯勒",
    "Knueppel": "克努佩尔",
    "Kuminga": "库明加",
    "Lively": "莱夫利",
    "Lopez": "洛佩斯",
    "Mann": "曼恩",
    "Manning": "曼宁",
    "Markkanen": "马尔卡宁",
    "Mathurin": "马瑟林",
    "Mbeng": "姆本格",
    "McCain": "麦凯恩",
    "McClung": "麦克朗",
    "McConnell": "麦康奈尔",
    "McDaniels": "麦克丹尼尔斯",
    "McKie": "麦基",
    "Murphy": "墨菲",
    "Murray": "穆雷",
    "Nance": "南斯",
    "Nembhard": "内姆哈德",
    "Nurkic": "努尔基奇",
    "Odom": "奥多姆",
    "Olynyk": "奥利尼克",
    "Petrie": "佩特里",
    "Plumlee": "普拉姆利",
    "Podziemski": "波杰姆斯基",
    "Poeltl": "珀尔特尔",
    "Porter": "波特",
    "Portis": "波蒂斯",
    "Powell": "鲍威尔",
    "Prince": "普林斯",
    "Queen": "奎因",
    "Queta": "克塔",
    "Raynaud": "雷诺",
    "Reaves": "里夫斯",
    "Reese": "里斯",
    "Reid": "里德",
    "Rogers": "罗杰斯",
    "Rollins": "罗林斯",
    "Ryan": "莱恩",
    "Saric": "沙里奇",
    "Sarr": "萨尔",
    "Schrempf": "施伦普夫",
    "Sengun": "申京",
    "Sensabaugh": "森萨博",
    "Sharpe": "夏普",
    "Sheppard": "谢泼德",
    "Simmons": "西蒙斯",
    "Smart": "斯马特",
    "Sochan": "索汉",
    "Starks": "斯塔克斯",
    "Stewart": "斯图尔特",
    "Suggs": "萨格斯",
    "Tarpley": "塔普利",
    "Terry": "特里",
    "Timme": "蒂米",
    "VanVleet": "范弗利特",
    "Vucevic": "武切维奇",
    "Wagner": "瓦格纳",
    "Ware": "韦尔",
    "Wembanyama": "文班亚马",
    "Whitehead": "怀特黑德",
    "Wiggins": "维金斯",
    "Zubac": "祖巴茨",
})

HOMOPHONE = {
    "阿": "雅",
    "艾": "爱",
    "安": "桉",
    "奥": "傲",
    "昂": "盎",
    "巴": "芭",
    "白": "柏",
    "保": "宝",
    "贝": "倍",
    "比": "彼",
    "宾": "彬",
    "伯": "柏",
    "波": "泊",
    "布": "步",
    "丹": "单",
    "德": "得",
    "邓": "登",
    "东": "冬",
    "杜": "渡",
    "恩": "蒽",
    "弗": "芙",
    "福": "馥",
    "格": "阁",
    "戈": "歌",
    "哈": "翰",
    "海": "亥",
    "华": "桦",
    "霍": "豁",
    "基": "吉",
    "吉": "季",
    "加": "嘉",
    "贾": "佳",
    "杰": "捷",
    "金": "津",
    "卡": "喀",
    "凯": "恺",
    "坎": "侃",
    "科": "柯",
    "库": "酷",
    "拉": "啦",
    "兰": "岚",
    "乐": "洛",
    "伦": "纶",
    "里": "理",
    "利": "立",
    "卢": "庐",
    "罗": "洛",
    "洛": "络",
    "马": "玛",
    "麦": "迈",
    "门": "闵",
    "米": "弥",
    "莫": "墨",
    "穆": "慕",
    "纳": "娜",
    "诺": "糯",
    "帕": "琶",
    "佩": "沛",
    "皮": "琵",
    "乔": "侨",
    "琼": "穹",
    "萨": "飒",
    "沙": "莎",
    "斯": "思",
    "塔": "榙",
    "特": "忒",
    "托": "拓",
    "汤": "唐",
    "唐": "塘",
    "威": "维",
    "韦": "维",
    "沃": "渥",
    "西": "熙",
    "希": "熙",
    "谢": "榭",
    "杨": "阳",
    "姚": "尧",
    "易": "奕",
    "孙": "荪",
    "王": "望",
    "周": "洲",
    "张": "璋",
    "詹": "瞻",
    "赵": "照",
    "胡": "湖",
    "巩": "拱",
    "刘": "柳",
    "吴": "梧",
    "贺": "鹤",
    "李": "理",
    "朱": "珠",
    "丁": "玎",
    "杜": "渡",
}

CBA_REPLACE_CANDIDATES = {
    "Louie Dampier",
    "Geoff Petrie",
    "David Thompson",
    "Dave Bing",
    "Dave DeBusschere",
    "Dave Cowens",
    "Walt Frazier",
    "Jerry Lucas",
    "Earl Monroe",
    "Bob McAdoo",
    "Billy Cunningham",
    "Wes Unseld",
    "Willis Reed",
    "Robert Parish",
    "Alex English",
    "Bill Walton",
    "Rick Barry",
    "George Gervin",
    "Elvin Hayes",
    "John Havlicek",
    "Pete Maravich",
    "Kevin McHale",
    "Moses Malone",
    "Dominique Wilkins",
}

FAME_PLAYER_REPLACEMENTS = {
    "Louie Dampier": ("Fred VanVleet", (4, 5)),
    "Bill Bradley": ("Andrew Wiggins", (4, 5)),
    "Bobby Jones": ("Zion Williamson", (4, 5)),
    "Don Nelson": ("Ben Simmons", (4, 5)),
    "Michael Cooper": ("Klay Thompson", (4, 5)),
    "Maurice Cheeks": ("Luka Dončić", (4, 5)),
    "Wes Unseld": ("Greg Oden", (4, 5)),
    "Pat Riley": ("Paul George", (4, 5)),
    "Phil Jackson": ("Deandre Ayton", (4, 5)),
    "Ricky Pierce": ("Zach LaVine", (6,)),
    "Bobby Jackson": ("J.R. Smith", (6,)),
    "Darrell Armstrong": ("Nick Young", (6,)),
    "Anthony Mason": ("Draymond Green", (6,)),
    "Danny Manning": ("Trae Young", (6,)),
    "Clifford Robinson": ("Blake Griffin", (6,)),
    "Kon Knueppel": ("Tyrese Haliburton", (3,)),
    "Dell Curry": ("Devin Booker", (6,)),
    "Detlef Schrempf": ("Pau Gasol", (6,)),
    "John Starks": ("Rajon Rondo", (6,)),
    "Eric Gordon": ("Amar'e Stoudemire", (6,)),
    "Mike Miller": ("DeMarcus Cousins", (6,)),
    "Lamar Odom": ("John Wall", (6,)),
    "Mark Price": ("Jaylen Brown", (4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15)),
}

LETTER_CN = {
    "a": "阿",
    "b": "布",
    "c": "卡",
    "d": "德",
    "e": "伊",
    "f": "弗",
    "g": "格",
    "h": "哈",
    "i": "艾",
    "j": "杰",
    "k": "凯",
    "l": "勒",
    "m": "马",
    "n": "纳",
    "o": "奥",
    "p": "帕",
    "q": "奇",
    "r": "瑞",
    "s": "斯",
    "t": "特",
    "u": "尤",
    "v": "维",
    "w": "威",
    "x": "克斯",
    "y": "杨",
    "z": "泽",
}


def ascii_name(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value))
    return text.encode("ascii", "ignore").decode("ascii")


def norm_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", ascii_name(value).lower())


def load_alltime_reference(path: Path) -> pd.DataFrame:
    aliases = {
        "Micheal Ray Richardson": "Michael Ray Richardson",
        "Penny Hardaway": "Anfernee Hardaway",
        "Ron Artest": "Metta World Peace",
    }
    team = ""
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^##\s+(.+?)\s+\(All-Time", line)
        if heading:
            team = heading.group(1)
            continue
        item = re.match(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|", line)
        if not item or not team:
            continue
        rank, player_name, overall = item.groups()
        canonical_name = aliases.get(player_name.strip(), player_name.strip())
        rows.append(
            {
                "name_key": norm_name(canonical_name),
                "alltime_player_name": player_name.strip(),
                "alltime_team": team,
                "alltime_rank": int(rank),
                "alltime_overall": int(overall),
            }
        )
    raw = pd.DataFrame(rows)
    if raw.empty:
        return raw
    return (
        raw.groupby("name_key", as_index=False)
        .agg(
            alltime_player_name=("alltime_player_name", "first"),
            alltime_overall=("alltime_overall", "max"),
            alltime_appearances=("alltime_team", "nunique"),
            alltime_best_rank=("alltime_rank", "min"),
            alltime_teams=("alltime_team", lambda values: " / ".join(dict.fromkeys(values))),
        )
    )


def clean_surname(player_name: str) -> str:
    text = ascii_name(player_name).replace(".", "")
    parts = [p for p in re.split(r"\s+", text.strip()) if p]
    while parts and parts[-1].lower() in {"jr", "sr", "ii", "iii", "iv", "v"}:
        parts.pop()
    return parts[-1] if parts else text


def fallback_cn_surname(surname: str) -> str:
    clean = re.sub(r"[^A-Za-z]", "", ascii_name(surname)).lower()
    if not clean:
        return "星"
    if clean.endswith("son"):
        return LETTER_CN.get(clean[0], "森") + "森"
    if clean.endswith("ton"):
        return LETTER_CN.get(clean[0], "唐") + "顿"
    if clean.endswith("man"):
        return LETTER_CN.get(clean[0], "曼") + "曼"
    if clean.endswith("ford"):
        return LETTER_CN.get(clean[0], "福") + "福德"
    return "".join(LETTER_CN.get(ch, "尔") for ch in clean[:4])


def spoof_name(player_name: str) -> tuple[str, str, str]:
    if player_name in CHINESE_NAME_BY_PLAYER:
        real_cn = CHINESE_NAME_BY_PLAYER[player_name]
    else:
        surname = clean_surname(player_name)
        real_cn = SURNAME_CN.get(surname) or SURNAME_CN.get(ascii_name(surname)) or fallback_cn_surname(surname)

    display_name = DISPLAY_NAME_OVERRIDES.get(player_name)
    if display_name is None:
        chars = list(real_cn)
        for idx, ch in enumerate(chars):
            if ch in HOMOPHONE:
                chars[idx] = HOMOPHONE[ch]
                break
        display_name = "".join(chars)
    return display_name, real_cn, clean_surname(player_name)


def spoof_chinese_name(name: str) -> str:
    if name in DISPLAY_NAME_OVERRIDES:
        return DISPLAY_NAME_OVERRIDES[name]
    chars = list(name)
    for idx, ch in enumerate(chars):
        if ch in HOMOPHONE:
            chars[idx] = HOMOPHONE[ch]
            return "".join(chars)
    return name


def scale_attr(row: pd.Series, quality: int) -> dict[str, int]:
    if bool(row.get("is_chinese_special", False)) and quality == 15:
        return dict(GOAT_FULL_ATTRIBUTES)

    raw = {
        "scoring": int(round(float(row["points_per_game"]) * 28)),
        "rebound": int(round(float(row["rebounds_per_game"]) * 30)),
        "assist": int(round(float(row["assists_per_game"]) * 22)),
        "steal": int(round(float(row["steals_per_game"]) * 38)),
        "block": int(round(float(row["blocks_per_game"]) * 35)),
    }
    bounds = RANGES[quality]
    keys = ["scoring", "rebound", "assist", "steal", "block"]
    out = {}
    for idx, key in enumerate(keys):
        lo = bounds[idx * 2]
        hi = bounds[idx * 2 + 1]
        out[key] = max(lo, min(hi, raw[key]))
    return out


def cba_quality_levels(player: dict) -> set[int]:
    return set(QUALITY_NAMES)


def cba_attributes(player: dict, quality: int) -> dict[str, int]:
    bounds = RANGES[quality]
    pos = player.get("position", "SF")
    bias_by_pos = {
        "PG": [0.62, 0.35, 0.95, 0.78, 0.25],
        "SG": [0.88, 0.42, 0.62, 0.76, 0.28],
        "SF": [0.82, 0.55, 0.55, 0.65, 0.45],
        "PF": [0.72, 0.82, 0.42, 0.52, 0.72],
        "C": [0.68, 0.92, 0.34, 0.42, 0.92],
    }
    biases = bias_by_pos.get(pos, bias_by_pos["SF"])
    tier_bonus = max(0, int(player.get("tier", 13)) - 13) * 0.05
    keys = ["scoring", "rebound", "assist", "steal", "block"]
    out = {}
    for idx, key in enumerate(keys):
        lo = bounds[idx * 2]
        hi = bounds[idx * 2 + 1]
        pct = min(0.96, biases[idx] + tier_bonus)
        out[key] = int(round(lo + (hi - lo) * pct))
    return out


def make_cba_card(player: dict, quality: int, index: int) -> dict:
    return {
        "id": f"card_q{quality:02d}_{player['id']}",
        "playerId": player["id"],
        "sourcePlayerName": player["name"],
        "displayName": spoof_chinese_name(player["name"]),
        "originalChineseSurname": player["name"],
        "realSurname": player["name"][0],
        "season": 0,
        "team": player.get("team", "CBA"),
        "position": player.get("position", ""),
        "quality": quality,
        "qualityName": QUALITY_NAMES[quality],
        "attributes": cba_attributes(player, quality),
        "sourceStats": {
            "points_per_game": None,
            "rebounds_per_game": None,
            "assists_per_game": None,
            "steals_per_game": None,
            "blocks_per_game": None,
        },
        "sourceLeague": "CBA",
        "isActiveEra": False,
        "isCuratedStar": True,
        "isChineseNationalSpecial": True,
        "nba2kOverall": None,
        "nba2kPotential": None,
        "nba2kPotentialRuleApplied": False,
        "specialQualityReason": "CBA大陆MVP/FMVP球星，开放新秀及以上所有品质",
        "goatAttributeOverrideApplied": False,
        "profileSourceGroup": "CBAAwardLocal",
        "cbaAwardProfile": {
            "mvpSeasons": player.get("mvpSeasons", []),
            "fmvpSeasons": player.get("fmvpSeasons", []),
            "tier": player.get("tier", 13),
        },
    }


def apply_cba_replacements(
    cards: list[dict],
    cba_players: list[dict],
    preserve_alltime: bool = False,
    protected_ids_by_quality: dict[int, set[str]] | None = None,
) -> list[dict]:
    if not cba_players:
        return cards

    cards_by_quality = defaultdict(list)
    for idx, card in enumerate(cards):
        cards_by_quality[card["quality"]].append((idx, card))

    replaced_indices = set()
    cba_ids = {p["id"] for p in cba_players}
    protected_ids_by_quality = protected_ids_by_quality or {}
    for quality in QUALITY_NAMES:
        eligible = [p for p in cba_players if quality in cba_quality_levels(p)]
        if not eligible:
            continue

        existing_cba_indices = [
            idx
            for idx, card in cards_by_quality[quality]
            if card["playerId"] in cba_ids
        ]
        if preserve_alltime:
            candidates = [
                (idx, card)
                for idx, card in cards_by_quality[quality]
                if card["playerId"] not in cba_ids
                and not card.get("isChineseNationalSpecial")
                and card["playerId"] not in protected_ids_by_quality.get(quality, set())
            ]
            candidates.sort(
                key=lambda item: (
                    bool(item[1].get("nba2kAllTimeReference")),
                    int(item[1].get("nba2kAllTimeOverall") or 0),
                )
            )
        else:
            candidates = [
                (idx, card)
                for idx, card in cards_by_quality[quality]
                if card["playerId"] not in cba_ids
                and (
                    card["sourcePlayerName"] in CBA_REPLACE_CANDIDATES
                    or card.get("isChineseNationalSpecial")
                    or card["season"] <= 1989
                )
            ]
        if len(candidates) < len(eligible):
            more = [
                (idx, card)
                for idx, card in cards_by_quality[quality]
                if idx not in {c[0] for c in candidates}
                and card["playerId"] not in cba_ids
                and not card.get("isChineseNationalSpecial")
                and card["playerId"] not in protected_ids_by_quality.get(quality, set())
            ]
            candidates.extend(more)

        target_slots = [(idx, cards[idx]) for idx in existing_cba_indices] + candidates
        for replace_no, (candidate, player) in enumerate(zip(target_slots, eligible), start=1):
            idx, _old_card = candidate
            cards[idx] = make_cba_card(player, quality, replace_no)
            replaced_indices.add(idx)

    return cards


def player_score(row: pd.Series) -> float:
    return (
        float(row["peak_points_per_game"]) * 2.3
        + float(row["peak_rebounds_per_game"]) * 1.2
        + float(row["peak_assists_per_game"]) * 1.5
        + float(row["peak_steals_per_game"]) * 5
        + float(row["peak_blocks_per_game"]) * 4
        + float(row["all_star_count"]) * 6
        + float(row["all_nba_count"]) * 8
        + float(row["mvp_count"]) * 35
        + (28 if bool(row["hof"]) else 0)
        + (12 if int(row["last_season"]) >= 2025 else 0)
    )


def pick_players(
    summary: pd.DataFrame,
    quality: int,
    forced_ids: list[str],
    excluded_ids: set[str] | None = None,
    prefer_alltime: bool = False,
    prefer_fame: bool = False,
) -> list[str]:
    chosen = []
    seen = set()
    seen_names = set()
    excluded_ids = excluded_ids or set()
    name_by_id = summary.set_index("player_id")["player_name"].to_dict()
    canonical_ids = set(
        summary.sort_values(
            ["score", "all_star_count", "all_nba_count"],
            ascending=False,
        )
        .drop_duplicates("name_key", keep="first")["player_id"]
    )

    def add_from(df: pd.DataFrame) -> None:
        for player_id in df["player_id"]:
            player_name_key = norm_name(str(name_by_id.get(player_id, player_id)))
            if (
                player_id not in canonical_ids
                or player_id in seen
                or player_id in excluded_ids
                or player_name_key in seen_names
            ):
                continue
            chosen.append(player_id)
            seen.add(player_id)
            seen_names.add(player_name_key)
            if len(chosen) >= 100:
                return

    for player_id in forced_ids:
        player_name_key = norm_name(str(name_by_id.get(player_id, player_id)))
        if (
            player_id in set(summary["player_id"])
            and player_id in canonical_ids
            and player_id not in excluded_ids
            and player_id not in seen
            and player_name_key not in seen_names
        ):
            chosen.append(player_id)
            seen.add(player_id)
            seen_names.add(player_name_key)
            if len(chosen) >= 100:
                return chosen

    if prefer_fame:
        pool = summary.copy()
        if quality == 3:
            pool["_quality_fit"] = pool["strong_rookie_priority"]
        elif quality in (4, 5):
            pool["_quality_fit"] = pool["bench_role_priority"]
        elif quality == 6:
            pool["_quality_fit"] = pool["sixth_role_priority"]
        elif quality == 7:
            pool["_quality_fit"] = pool["starter_role_priority"]
        elif quality == 8:
            pool["_quality_fit"] = pool["core_role_priority"]
        elif quality == 9:
            pool["_quality_fit"] = pool["all_star_count"]
        elif quality == 10:
            pool["_quality_fit"] = pool["all_nba_count"]
        elif quality == 11:
            pool["_quality_fit"] = pool["mvp_count"]
        elif quality == 12:
            pool["_quality_fit"] = pool["championship_role_priority"]
        elif quality == 13:
            pool["_quality_fit"] = pool["hof"].astype(int)
        else:
            pool["_quality_fit"] = pool["historical_dominance_priority"]
        pool = pool.sort_values(
            ["fame_band", "era_priority", "_quality_fit", "strong_rookie_priority", "fame_score"],
            ascending=False,
        )
    elif prefer_alltime and quality >= 11:
        pool = summary.sort_values(
            ["special_potential_priority", "alltime_priority", "alltime_overall", "star_priority", "score"],
            ascending=False,
        )
    elif prefer_alltime and quality >= 7:
        pool = summary.sort_values(
            ["alltime_priority", "alltime_overall", "active_priority", "star_priority", "score"],
            ascending=False,
        )
    elif prefer_alltime and quality == 6:
        pool = summary.sort_values(
            ["alltime_sixth_priority", "sixth_man_priority", "active_priority", "alltime_overall", "score"],
            ascending=False,
        )
    elif prefer_alltime and quality in (4, 5):
        pool = summary.sort_values(
            ["alltime_bench_priority", "active_priority", "bench_score", "alltime_overall", "score"],
            ascending=False,
        )
    elif prefer_alltime and quality == 3:
        pool = summary.sort_values(
            ["rookie_priority", "active_priority", "alltime_priority", "rookie_score"],
            ascending=False,
        )
    elif quality >= 11:
        pool = summary.sort_values(["special_potential_priority", "star_priority", "score"], ascending=False)
    elif quality >= 9:
        pool = summary.sort_values(["special_potential_priority", "active_priority", "star_priority", "score"], ascending=False)
    elif quality == 6:
        pool = summary.sort_values(["sixth_man_priority", "active_priority", "score"], ascending=False)
    elif quality >= 7:
        pool = summary.sort_values(["active_priority", "score"], ascending=False)
    elif quality == 3:
        pool = summary.sort_values(["rookie_priority", "active_priority", "rookie_score"], ascending=False)
    elif quality in (4, 5):
        pool = summary.sort_values(["active_priority", "bench_score", "score"], ascending=False)

    add_from(pool)
    if len(chosen) < 100:
        add_from(summary.sort_values("score", ascending=False))
    return chosen[:100]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--alltime-priority",
        action="store_true",
        help="Prioritize players from data/nba2k_alltime_teams.md and write separate v2 outputs.",
    )
    parser.add_argument(
        "--fame-priority",
        action="store_true",
        help="Allow every player in every quality and rank by fame, era, real role history, then rookie strength.",
    )
    args = parser.parse_args()
    if args.fame_priority:
        out_json, out_csv = FAME_OUT_JSON, FAME_OUT_CSV
    elif args.alltime_priority:
        out_json, out_csv = ALLTIME_OUT_JSON, ALLTIME_OUT_CSV
    else:
        out_json, out_csv = OUT_JSON, OUT_CSV

    stats_path = (
        DATA / "nba_player_season_five_stats.csv"
        if args.alltime_priority or args.fame_priority
        else DATA / "nba_player_season_five_stats_complete_1974_present.csv"
    )
    stats = pd.read_csv(stats_path)
    for column in [
        "points_per_game",
        "rebounds_per_game",
        "assists_per_game",
        "steals_per_game",
        "blocks_per_game",
    ]:
        stats[column] = stats[column].fillna(0)
    career = pd.read_csv(DATA / "raw" / "nba-aba-baa-stats" / "Player Career Info.csv")
    awards = pd.read_csv(DATA / "raw" / "nba-aba-baa-stats" / "Player Award Shares.csv")
    teams = pd.read_csv(DATA / "raw" / "nba-aba-baa-stats" / "End of Season Teams.csv")
    all_star = pd.read_csv(DATA / "raw" / "nba-aba-baa-stats" / "All-Star Selections.csv")
    profiles = json.loads((DATA / "star_card_quality_profiles.json").read_text(encoding="utf-8"))
    nba2k_path = DATA / "nba2k25_player_ratings.csv"
    nba2k = pd.read_csv(nba2k_path) if nba2k_path.exists() else pd.DataFrame()
    cba_path = DATA / "cba_local_award_stars.json"
    cba_players = json.loads(cba_path.read_text(encoding="utf-8"))["players"] if cba_path.exists() else []

    profile_by_id = {p["player_id"]: p for p in profiles["players"]}
    star_ids = set(profile_by_id)
    chinese_ids = {p["player_id"] for p in profiles["players"] if p.get("is_chinese_national_special")}

    all_star_count = all_star.groupby("player_id").size().rename("all_star_count")
    all_nba_count = (
        teams[teams["type"].isin(["All-NBA", "All-ABA", "All-BAA"])]
        .groupby("player_id")
        .size()
        .rename("all_nba_count")
    )
    mvp_count = (
        awards[
            awards["award"].isin(["nba mvp", "aba mvp"])
            & awards["winner"].astype(str).str.lower().isin(["true", "1"])
        ]
        .groupby("player_id")
        .size()
        .rename("mvp_count")
    )
    smoy_count = (
        awards[
            awards["award"].eq("nba smoy")
            & awards["winner"].astype(str).str.lower().isin(["true", "1"])
        ]
        .groupby("player_id")
        .size()
        .rename("smoy_count")
    )

    agg = stats.groupby("player_id").agg(
        player_name=("player_name", "last"),
        first_season=("season", "min"),
        last_season=("season", "max"),
        position=("position", lambda x: x.dropna().mode().iloc[0] if len(x.dropna()) else ""),
        min_points_per_game=("points_per_game", "min"),
        peak_points_per_game=("points_per_game", "max"),
        peak_rebounds_per_game=("rebounds_per_game", "max"),
        peak_assists_per_game=("assists_per_game", "max"),
        peak_steals_per_game=("steals_per_game", "max"),
        peak_blocks_per_game=("blocks_per_game", "max"),
        max_games_played=("games_played", "max"),
    )
    summary = agg.join([all_star_count, all_nba_count, mvp_count, smoy_count]).fillna(0).reset_index()
    summary = summary.merge(career[["player_id", "hof"]], on="player_id", how="left")
    summary["hof"] = summary["hof"].fillna(False)
    summary["name_key"] = summary["player_name"].map(norm_name)

    if args.alltime_priority or args.fame_priority:
        alltime_reference = load_alltime_reference(ALLTIME_REFERENCE)
        summary = summary.merge(alltime_reference, on="name_key", how="left")
    else:
        summary["alltime_player_name"] = ""
        summary["alltime_overall"] = math.nan
        summary["alltime_appearances"] = 0
        summary["alltime_best_rank"] = math.nan
        summary["alltime_teams"] = ""
    summary["alltime_overall"] = summary["alltime_overall"].fillna(0)
    summary["alltime_appearances"] = summary["alltime_appearances"].fillna(0)
    summary["alltime_player_name"] = summary["alltime_player_name"].fillna("")
    summary["alltime_teams"] = summary["alltime_teams"].fillna("")

    if len(nba2k):
        nba2k = nba2k.copy()
        nba2k["name_key"] = nba2k["player_name"].map(norm_name)
        current_2k = (
            nba2k[nba2k["dataset_group"].eq("current")]
            .sort_values(["name_key", "potential", "overall"], ascending=[True, False, False])
            .drop_duplicates("name_key", keep="first")
            [["name_key", "overall", "potential"]]
            .rename(columns={"overall": "nba2k_current_overall", "potential": "nba2k_current_potential"})
        )
        all_time_2k = (
            nba2k[nba2k["dataset_group"].eq("all_time")]
            .sort_values(["name_key", "potential", "overall"], ascending=[True, False, False])
            .drop_duplicates("name_key", keep="first")
            [["name_key", "overall", "potential"]]
            .rename(columns={"overall": "nba2k_all_time_overall", "potential": "nba2k_all_time_potential"})
        )
        summary = summary.merge(current_2k, on="name_key", how="left")
        summary = summary.merge(all_time_2k, on="name_key", how="left")
    else:
        summary["nba2k_current_overall"] = math.nan
        summary["nba2k_current_potential"] = math.nan
        summary["nba2k_all_time_overall"] = math.nan
        summary["nba2k_all_time_potential"] = math.nan

    summary["nba2k_overall"] = summary["nba2k_current_overall"].combine_first(summary["nba2k_all_time_overall"])
    summary["nba2k_potential"] = summary["nba2k_current_potential"].combine_first(summary["nba2k_all_time_potential"])
    summary["score"] = summary.apply(player_score, axis=1)
    summary["star_priority"] = summary["player_id"].isin(star_ids).astype(int)
    summary["profile_quality_levels"] = summary["player_id"].map(
        lambda player_id: set(profile_by_id.get(player_id, {}).get("quality_levels", []))
    )
    summary["active_priority"] = (summary["last_season"] >= 2025).astype(int)
    summary["sixth_man_priority"] = (
        (summary["smoy_count"] > 0).astype(int) * 10
        + ((summary["peak_points_per_game"] >= 12) & (summary["all_star_count"] <= 2)).astype(int)
    )
    summary["rookie_priority"] = (
        ((summary["first_season"] >= 2022) & (summary["last_season"] >= 2025)).astype(int) * 100
        + ((summary["first_season"] >= 2019) & (summary["last_season"] >= 2025)).astype(int) * 35
        + summary["active_priority"] * 15
    )
    summary["rookie_score"] = summary["rookie_priority"] + summary["score"] * 0.2
    summary["bench_score"] = (
        (summary["peak_points_per_game"].between(6, 15)).astype(int) * 20
        + summary["active_priority"] * 12
        + summary["score"] * 0.2
    )
    summary["alltime_priority"] = (summary["alltime_overall"] > 0).astype(int)
    summary["fame_band"] = 0
    summary.loc[
        (summary["alltime_overall"] > 0) | (summary["all_star_count"] > 0) | (summary["star_priority"] > 0),
        "fame_band",
    ] = 1
    summary.loc[
        (summary["alltime_overall"] >= 85) | (summary["all_star_count"] >= 3) | (summary["nba2k_overall"].fillna(0) >= 85),
        "fame_band",
    ] = 2
    summary.loc[
        (summary["alltime_overall"] >= 89) | (summary["all_nba_count"] >= 3) | (summary["nba2k_overall"].fillna(0) >= 89),
        "fame_band",
    ] = 3
    summary.loc[
        (summary["alltime_overall"] >= 93) | (summary["mvp_count"] > 0) | summary["hof"].astype(bool),
        "fame_band",
    ] = 4
    summary.loc[(summary["alltime_overall"] >= 97) | (summary["mvp_count"] >= 2), "fame_band"] = 5
    summary["era_priority"] = summary["last_season"].clip(lower=1947)
    summary["fame_score"] = (
        summary["alltime_overall"] * 10
        + summary["alltime_appearances"] * 8
        + summary["all_star_count"] * 4
        + summary["all_nba_count"] * 5
        + summary["mvp_count"] * 30
        + summary["star_priority"] * 25
        + summary["nba2k_overall"].fillna(0)
    )
    summary["strong_rookie_priority"] = (
        (summary["first_season"] >= 2022).astype(int) * 100
        + (summary["first_season"] >= 2019).astype(int) * 30
        + (summary["first_season"] - 2021).clip(lower=0) * 20
        + summary["nba2k_potential"].fillna(0)
        + summary["rookie_score"]
    )
    summary["bench_role_priority"] = (
        (summary["min_points_per_game"] <= 8).astype(int) * 20
        + (summary["peak_points_per_game"].between(6, 18)).astype(int) * 10
    )
    summary["sixth_role_priority"] = (
        (summary["smoy_count"] > 0).astype(int) * 100
        + (summary["min_points_per_game"] <= 10).astype(int) * 20
        + (summary["peak_points_per_game"].between(12, 24)).astype(int) * 10
    )
    summary["starter_role_priority"] = (summary["peak_points_per_game"] >= 10).astype(int)
    summary["core_role_priority"] = (
        summary["all_star_count"] * 10 + summary["all_nba_count"] * 5 + (summary["peak_points_per_game"] >= 20).astype(int)
    )
    summary["championship_role_priority"] = summary["mvp_count"] * 20 + summary["all_nba_count"] * 3
    summary["historical_dominance_priority"] = (
        summary["mvp_count"] * 100 + summary["all_nba_count"] * 10 + summary["all_star_count"] + summary["hof"].astype(int) * 25
    )
    summary["alltime_bench_priority"] = (
        summary.apply(
            lambda row: int(
                row["alltime_priority"]
                and (
                    bool({4, 5} & row["profile_quality_levels"])
                    or (
                        row["all_star_count"] <= 2
                        and row["peak_points_per_game"] <= 18
                        and row["min_points_per_game"] <= 10
                    )
                )
            ),
            axis=1,
        )
    )
    summary["alltime_sixth_priority"] = (
        summary.apply(
            lambda row: int(
                row["alltime_priority"]
                and (
                    6 in row["profile_quality_levels"]
                    or row["smoy_count"] > 0
                    or (
                        12 <= row["peak_points_per_game"] <= 22
                        and row["all_star_count"] <= 2
                    )
                )
            ),
            axis=1,
        )
    )
    summary["is_chinese_special"] = summary["player_id"].isin(chinese_ids)
    summary["special_potential_priority"] = (
        (summary["nba2k_potential"].fillna(0) >= 98).astype(int) * 100
        + (summary["nba2k_potential"].fillna(0) >= 95).astype(int) * 40
        + (summary["nba2k_potential"].fillna(0) >= 90).astype(int) * 12
    )
    summary["score"] = summary["score"] + summary["nba2k_potential"].fillna(0) * 0.8 + summary["nba2k_overall"].fillna(0) * 0.4

    season_rows = {}
    for quality in QUALITY_NAMES:
        if quality == 3:
            rookie_candidates = stats[
                (stats["season"] >= 2022) & (stats["player_id"].isin(set(summary["player_id"])))
            ]
            idx = stats.sort_values(["season"]).groupby("player_id").head(1).index
            quality_stats = stats.loc[idx]
        elif quality <= 6:
            quality_stats = stats.sort_values(["points_per_game", "games_played"], ascending=[True, False]).groupby("player_id").tail(1)
        else:
            quality_stats = stats.sort_values(["points_per_game", "games_played"], ascending=[False, False]).groupby("player_id").head(1)
        season_rows[quality] = quality_stats.set_index("player_id")

    forced_ids = [pid for pid in chinese_ids if pid in set(summary["player_id"])]
    id_by_name = {row["player_name"]: row["player_id"] for _, row in summary.iterrows()}
    special_include_by_quality = defaultdict(list)
    special_exclude_by_quality = defaultdict(set)
    special_reason_by_id = {}
    for player_name, rule in SPECIAL_QUALITY_RULES.items():
        player_id = id_by_name.get(player_name)
        if not player_id:
            continue
        special_reason_by_id[player_id] = rule["reason"]
        for quality in rule["include"]:
            special_include_by_quality[quality].append(player_id)
        for quality in rule["exclude"]:
            special_exclude_by_quality[quality].add(player_id)

    for _, row in summary[summary["nba2k_potential"].fillna(0) >= 95].iterrows():
        player_id = row["player_id"]
        for quality in range(9, 16):
            special_include_by_quality[quality].append(player_id)
    for _, row in summary[(summary["nba2k_potential"].fillna(0) >= 90) & (summary["first_season"] >= 2019)].iterrows():
        player_id = row["player_id"]
        for quality in range(7, 11):
            special_include_by_quality[quality].append(player_id)

    alltime_include_by_quality = defaultdict(list)
    if args.alltime_priority:
        alltime_ranked = summary[summary["alltime_priority"] > 0].sort_values(
            ["alltime_overall", "alltime_appearances", "score"],
            ascending=False,
        )
        alltime_include_by_quality[3] = list(alltime_ranked["player_id"].head(30))
        for quality in (4, 5):
            eligible = alltime_ranked[alltime_ranked["alltime_bench_priority"] > 0]
            alltime_include_by_quality[quality] = list(eligible["player_id"].head(30))
            special_exclude_by_quality[quality].update(
                alltime_ranked[alltime_ranked["alltime_bench_priority"] <= 0]["player_id"]
            )
        sixth_eligible = alltime_ranked[alltime_ranked["alltime_sixth_priority"] > 0]
        alltime_include_by_quality[6] = list(sixth_eligible["player_id"].head(30))
        special_exclude_by_quality[6].update(
            alltime_ranked[alltime_ranked["alltime_sixth_priority"] <= 0]["player_id"]
        )
        for quality in range(7, 11):
            alltime_include_by_quality[quality] = list(alltime_ranked["player_id"].head(70))
        for quality in range(11, 16):
            alltime_include_by_quality[quality] = list(alltime_ranked["player_id"].head(85))

    fame_include_by_quality = defaultdict(list)
    fame_exclude_by_quality = defaultdict(set)
    if args.fame_priority:
        recent_cutoff = 2024
        fame_exclude_by_quality[3].update(
            summary[
                (summary["first_season"] >= recent_cutoff)
                & (~summary["player_name"].isin(RECENT_ROOKIE_KEEP_NAMES))
            ]["player_id"]
        )
        recent_rookies = summary[
            (summary["first_season"] >= 2022)
            & (summary["last_season"] >= 2025)
        ]
        latest_rookies = recent_rookies.sort_values(
            ["first_season", "nba2k_potential", "score"],
            ascending=False,
        )
        strongest_rookies = recent_rookies.sort_values(
            ["nba2k_potential", "score", "fame_band", "first_season"],
            ascending=False,
        )
        original_recent_candidates = list(
            dict.fromkeys(
                list(latest_rookies["player_id"].head(8))
                + list(strongest_rookies["player_id"])
            )
        )[:20]
        fame_include_by_quality[3] = [
            player_id
            for player_id in original_recent_candidates
            if player_id not in fame_exclude_by_quality[3]
        ]
        recognizable = summary[summary["fame_band"] >= 1]
        bench_representatives = recognizable.sort_values(
            ["bench_role_priority", "fame_band", "era_priority", "fame_score"],
            ascending=False,
        )
        for quality in (4, 5):
            fame_include_by_quality[quality] = list(bench_representatives["player_id"].head(15))
        sixth_representatives = recognizable.sort_values(
            ["sixth_role_priority", "fame_band", "era_priority", "fame_score"],
            ascending=False,
        )
        fame_include_by_quality[6] = list(sixth_representatives["player_id"].head(20))

        # Producer-approved v3 recognizability replacements. Remove the old
        # prototypes from every quality and put the replacement in the same
        # low-quality slots the old prototype occupied.
        for old_name, (new_name, qualities) in FAME_PLAYER_REPLACEMENTS.items():
            new_id = id_by_name.get(new_name)
            old_ids = set(
                summary.loc[summary["player_name"].eq(old_name), "player_id"]
            )
            for quality in QUALITY_NAMES:
                fame_exclude_by_quality[quality].update(old_ids)
            if not new_id:
                raise ValueError(f"Missing replacement player in source data: {new_name}")
            for quality in qualities:
                fame_include_by_quality[quality].append(new_id)

    cards = []
    source_counter = Counter()

    for quality in QUALITY_NAMES:
        fame_mode = args.fame_priority
        quality_forced_ids = list(
            dict.fromkeys(
                forced_ids
                + ([] if fame_mode else alltime_include_by_quality.get(quality, []))
                + ([] if fame_mode else special_include_by_quality.get(quality, []))
                + (fame_include_by_quality.get(quality, []) if fame_mode else [])
            )
        )
        player_ids = pick_players(
            summary,
            quality,
            quality_forced_ids,
            (
                fame_exclude_by_quality.get(quality, set())
                if fame_mode
                else special_exclude_by_quality.get(quality, set())
            ),
            prefer_alltime=args.alltime_priority,
            prefer_fame=fame_mode,
        )
        for index, player_id in enumerate(player_ids, start=1):
            row = season_rows[quality].loc[player_id]
            player_name = str(row["player_name"])
            display_name, original_cn_surname, real_surname = spoof_name(player_name)
            row = row.copy()
            row["is_chinese_special"] = player_id in chinese_ids
            attributes = scale_attr(row, quality)
            source_counter[player_id] += 1
            profile = profile_by_id.get(player_id, {})
            summary_row = summary[summary["player_id"].eq(player_id)].iloc[0]

            cards.append(
                {
                    "id": f"card_q{quality:02d}_{index:03d}",
                    "playerId": player_id,
                    "sourcePlayerName": player_name,
                    "displayName": display_name,
                    "originalChineseSurname": original_cn_surname,
                    "realSurname": real_surname,
                    "season": int(row["season"]),
                    "team": str(row["team"]),
                    "position": str(row["position"]),
                    "quality": quality,
                    "qualityName": QUALITY_NAMES[quality],
                    "attributes": attributes,
                    "sourceStats": {
                        "points_per_game": float(row["points_per_game"]),
                        "rebounds_per_game": float(row["rebounds_per_game"]),
                        "assists_per_game": float(row["assists_per_game"]),
                        "steals_per_game": float(row["steals_per_game"]),
                        "blocks_per_game": float(row["blocks_per_game"]),
                    },
                    "sourceLeague": "NBA",
                    "isActiveEra": bool(int(summary.loc[summary["player_id"].eq(player_id), "last_season"].iloc[0]) >= 2025),
                    "isCuratedStar": player_id in star_ids,
                    "isChineseNationalSpecial": player_id in chinese_ids,
                    "nba2kOverall": None if pd.isna(summary_row["nba2k_overall"]) else int(summary_row["nba2k_overall"]),
                    "nba2kPotential": None if pd.isna(summary_row["nba2k_potential"]) else int(summary_row["nba2k_potential"]),
                    "nba2kPotentialRuleApplied": bool(player_id in special_include_by_quality.get(quality, [])),
                    "specialQualityReason": special_reason_by_id.get(player_id, ""),
                    "goatAttributeOverrideApplied": bool(player_id in chinese_ids and quality == 15),
                    "profileSourceGroup": profile.get("source_group", ""),
                    "nba2kAllTimeReference": bool(summary_row["alltime_priority"]),
                    "nba2kAllTimeOverall": (
                        None if not summary_row["alltime_priority"] else int(summary_row["alltime_overall"])
                    ),
                    "nba2kAllTimeTeams": str(summary_row["alltime_teams"] or ""),
                }
            )

    cards = apply_cba_replacements(
        cards,
        cba_players,
        preserve_alltime=args.alltime_priority or args.fame_priority,
        protected_ids_by_quality={
            quality: set(player_ids)
            for quality, player_ids in fame_include_by_quality.items()
        },
    )

    count_by_quality = Counter(card["qualityName"] for card in cards)
    source_league_counts = Counter(card.get("sourceLeague", "NBA") for card in cards)
    output = {
        "_meta": {
            "version": (
                "3.0-fame-priority"
                if args.fame_priority
                else ("2.0-alltime-priority" if args.alltime_priority else "1.0")
            ),
            "description": "Real NBA player card config. Every remaining quality contains 100 real-player cards. Pre-rookie qualities were removed.",
            "name_rule": "Display names use the approved Chinese prefix from the matching avatar filename; fallback generation replaces one character of the translated surname with a near-homophone.",
            "quality_rule": "Quality is a game rarity tier. High quality pools prioritize active stars, NBA 75, strong non-selected stars, and Hall-of-Fame level players.",
            "nba2k_rule": "NBA 2K25 overall/potential is used as an additional high-ceiling signal. Potential 95+ players can enter high-quality pools; 90+ young players are promoted in starter-to-best-lineup pools.",
            "alltime_reference_rule": (
                "NBA 2K27 all-time team rosters are used as the primary recognizability reference."
                if args.alltime_priority or args.fame_priority
                else ""
            ),
            "fame_priority_rule": (
                "Every player may appear in every quality. Ranking priority is fame, active era, real role history, then recent rookie strength."
                if args.fame_priority
                else ""
            ),
            "special_quality_rules": SPECIAL_QUALITY_RULES,
            "cba_replacement_rule": "Mainland Chinese CBA regular-season MVP and Finals MVP stars replace selected NBA cards in every remaining quality pool.",
            "chinese_special_rule": "Chinese-national special players are included in every quality. Their GOAT cards use full attributes.",
            "count": len(cards),
            "count_by_quality": dict(sorted(count_by_quality.items())),
            "count_by_source_league": dict(sorted(source_league_counts.items())),
            "fields": ["id", "playerId", "sourcePlayerName", "displayName", "season", "team", "position", "quality", "attributes"],
        },
        "players": cards,
    }
    out_json.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    flat = []
    for card in cards:
        item = card.copy()
        item.update(card["attributes"])
        item.update({f"stat_{k}": v for k, v in card["sourceStats"].items()})
        if "cbaAwardProfile" in item:
            item["cbaAwardProfile"] = json.dumps(item["cbaAwardProfile"], ensure_ascii=False)
        item.pop("attributes")
        item.pop("sourceStats")
        flat.append(item)
    pd.DataFrame(flat).to_csv(out_csv, index=False, encoding="utf-8-sig")

    print(f"wrote {out_json}")
    print(f"wrote {out_csv}")
    print(f"cards={len(cards)}")
    for quality in QUALITY_NAMES:
        print(f"{quality:02d} {QUALITY_NAMES[quality]}: {sum(1 for c in cards if c['quality'] == quality)}")


if __name__ == "__main__":
    main()
