# 数值配置目录

本目录是当前游戏具体数值的唯一来源；GDD负责系统规则与公式说明。修改后必须同时校验 JSON、跨表数量和 GDD 口径。

| 文件 | 内容 | 状态 |
|---|---|---|
| `recruitment_probability.json` | 130级球队市值的13品质招募权重 | 已配置 |
| `team_progression.json` | 130级市值、520级球队等级与斗志曲线 | 已配置 |
| `player_ovr_ranges.json` | 各品质OVR区间与重叠规则 | 已定稿 |
| `position_attribute_weights.json` | 五位置的五项属性初始权重 | 暂定 |
| `economy.json` | 招募、预算来源、广告与管理层升级成本 | 已配置 |
| `match_rewards.json` | 13个品质赛季共1274场逐场奖励 | 已配置 |
| `season_achievements.json` | 13枚98–0全胜冠军成就 | 已配置 |
| `concept_god_recruitment.json` | GOAT计数保底及0–12名概念神门槛 | 已定稿 |
| `concept_god_values.json` | 概念神动态数值、MAX与毕业必胜 | 已定稿 |
| `management_effects.json` | 五管理层1–520级效果 | 已配置 |
| `season_pacing.json` | 赛季难度、比分、赛程与概念神无限模式 | 部分待定 |
| `player_pool.json` | 每品质卡量和NBA/CBA构成 | 已定稿 |

## 尚未定稿

- 概念神无限赛程的起始对手OVR、逐场增长公式和里程碑奖励。
- 概念神视觉表现不属于本目录数值范围。

旧版 `outputs/balance_review/篮球游戏数值审核表_v0.1.xlsx` 早于当前 v0.73 规则，已清理，不再作为审核真源。
