# 数据目录

本目录保存当前球员配置、生成输入、概念神内容和数值配置。当前项目真源如下：

| 文件 | 用途 |
|---|---|
| `player_config_fame_v3.json` | 程序读取的正式球员卡模板，13品质×100张 |
| `player_config_fame_v3.csv` | 正式球员卡模板的人工检查表 |
| `balance/*.json` | 游戏数值配置 |
| `concept_god_pool.json` | 48张概念神结构化卡池 |
| `nba_concept_gods.md` | 概念神原始梗素材 |
| `cba_local_award_stars.json` | 20名CBA大陆MVP/FMVP球员池 |

## 球员配置生成输入

- `nba_player_season_five_stats.csv`：NBA/BAA逐球员逐赛季五项数据。
- `nba_player_season_five_stats_complete_1974_present.csv`：五项数据完整的1974年至今子集。
- `nba_player_season_five_stats.meta.json`：数据来源与生成信息。
- `nba2k25_player_ratings.csv`、`nba2k25_player_ratings.meta.json`：NBA 2K25评分与潜力参考。
- `nba2k_alltime_teams.md`：历史球队辨识度参考。
- `star_card_quality_profiles.json/csv`：球星品质候选与中国球员特例。
- `raw/`：上述生成流程需要的原始数据副本。

## 生成方式

运行 `scripts/generate_player_config.py --fame-priority` 生成当前正式 JSON 与 CSV。旧版 `player_config` 和 `player_config_alltime_v2` 已清理，不得作为当前运行输入。

## 头像

球员在游戏中的显示名以 `篮球CocosProject/assets/resources/images/头像` 内头像文件名下划线前的中文为准；`player_config_fame_v3.json/csv` 的 `displayName` 必须与其保持一致。头像范围和官方来源状态见 `headshots_official/manifest.csv`。
