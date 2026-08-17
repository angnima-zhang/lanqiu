# 数值配置目录

本目录是当前游戏具体数值的唯一来源；GDD负责系统规则与公式说明。修改后必须同时校验 JSON、跨表数量和 GDD 口径。

| 文件 | 内容 | 状态 |
|---|---|---|
| `recruitment_probability.json` | 0–100级球队的五档滚动招募池与无限赛程GOAT概率规则 | 已配置 |
| `team_progression.json` | 0–100级球队、斗志上限与资格赛升级规则 | 已配置 |
| `player_ovr_ranges.json` | 各品质OVR区间与重叠规则 | 已定稿 |
| `position_attribute_weights.json` | 五位置的五项属性初始权重 | 暂定 |
| `economy.json` | 招募、预算来源、广告与管理层升级成本 | 已配置 |
| `match_rewards.json` | 100场标准主线、杯赛/全明星倍率和无限赛程难度 | 已配置 |
| `season_achievements.json` | 旧13赛季成就数据，当前运行时不读取 | 已废弃 |
| `concept_god_upgrade.json` | GOAT广告升级概念神、累计数量倍率与属性强化 | 已定稿 |
| `concept_god_recruitment.json` | 旧GOAT计数保底规则 | 已废弃 |
| `concept_god_values.json` | 旧阵容动态数值规则 | 已废弃 |
| `management_effects.json` | 五管理层0–100级效果 | 已配置 |
| `season_pacing.json` | 100场赛程、比赛时长与概念神无限模式 | 已配置 |
| `player_pool.json` | 每品质卡量和NBA/CBA构成 | 已定稿 |

## 尚未定稿

- 概念神无限赛程从标准主线GOAT节点接续，当前采用每胜1.08倍对手OVR和GOAT概率每胜+0.5个百分点的初版曲线；主题队、混搭队与概念神专属能力UI留待后续细化。
- 概念神视觉表现不属于本目录数值范围。

旧版 `outputs/balance_review/篮球游戏数值审核表_v0.1.xlsx` 早于当前 v0.73 规则，已清理，不再作为审核真源。
