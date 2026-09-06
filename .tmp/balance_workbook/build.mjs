import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const project = "D:/篮球";
const balanceDir = `${project}/data/balance`;
const outputPath = `${balanceDir}/篮球游戏数值配置表.xlsx`;
const previewDir = `${project}/.tmp/balance_workbook/previews`;

const load = async (name, base = balanceDir) => JSON.parse(await fs.readFile(path.join(base, name), "utf8"));
const data = {};
for (const name of [
  "recruitment_probability.json", "team_progression.json", "player_ovr_ranges.json",
  "position_attribute_weights.json", "economy.json", "management_effects.json",
  "match_rewards.json", "season_achievements.json", "season_pacing.json",
  "concept_god_recruitment.json", "concept_god_values.json", "player_pool.json",
]) data[name] = await load(name);
data["concept_god_pool.json"] = await load("concept_god_pool.json", `${project}/data`);

const wb = Workbook.create();
const qualityNameById = {
  3: "新秀", 4: "饮水机", 5: "轮换", 6: "第六人", 7: "首发", 8: "核心",
  9: "全明星", 10: "最佳阵容", 11: "MVP", 12: "FMVP", 13: "名人堂", 14: "传奇", 15: "GOAT",
};
const theme = {
  navy: "#073642", teal: "#0E6470", cyan: "#45C4C8", gold: "#E6A928",
  cream: "#FFF5D6", light: "#E8F3F3", white: "#FFFFFF", text: "#17343A",
  border: "#A9C6C8", input: "#FFF8E5",
};

function scalar(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v) || typeof v === "object") return JSON.stringify(v);
  return v;
}

function flattenRecord(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flattenRecord(v, key, out);
    else out[key] = scalar(v);
  }
  return out;
}

function flattenSettings(obj, prefix = "", rows = [], skip = new Set()) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (skip.has(key)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) flattenSettings(v, key, rows, skip);
    else rows.push({ 配置路径: key, 值: scalar(v), 数据类型: Array.isArray(v) ? "数组" : typeof v });
  }
  return rows;
}

function excelCol(n) {
  let s = "";
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
}

function addTableSheet(name, title, source, rows, preferred = []) {
  const sheet = wb.worksheets.add(name);
  sheet.showGridLines = false;
  const keys = [...preferred];
  for (const row of rows) for (const k of Object.keys(row)) if (!keys.includes(k)) keys.push(k);
  if (!keys.length) keys.push("配置项");
  const last = excelCol(keys.length);
  sheet.getRange(`A1:${last}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = { fill: theme.navy, font: { bold: true, color: theme.white, size: 16 }, rowHeight: 30, verticalAlignment: "center" };
  sheet.getRange(`A2:${last}2`).merge();
  sheet.getRange("A2").values = [[`数据来源：${source}　|　生成依据：GDD 数值配置索引与当前 JSON 真源`]];
  sheet.getRange("A2").format = { fill: theme.light, font: { color: theme.text, italic: true }, rowHeight: 24 };
  sheet.getRange(`A4:${last}4`).values = [keys];
  sheet.getRange(`A4:${last}4`).format = { fill: theme.teal, font: { bold: true, color: theme.white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, rowHeight: 30, borders: { preset: "outside", style: "thin", color: theme.border } };
  if (rows.length) {
    const matrix = rows.map(r => keys.map(k => scalar(r[k])));
    sheet.getRange(`A5:${last}${rows.length + 4}`).values = matrix;
    if (rows.length <= 200) sheet.getRange(`A5:${last}${rows.length + 4}`).format = { font: { color: theme.text }, verticalAlignment: "center", borders: { insideHorizontal: { style: "thin", color: "#DCE8E9" } } };
  }
  sheet.freezePanes.freezeRows(4);
  for (let c = 0; c < keys.length; c++) {
    const col = sheet.getRange(`${excelCol(c + 1)}1:${excelCol(c + 1)}4`);
    const key = keys[c].toLowerCase();
    col.format.columnWidth = key.includes("description") || key.includes("formula") || key.includes("rule") || key.includes("说明") || key.includes("配置路径") ? 42 : 18;
  }
  return sheet;
}

// 配置索引
const indexRows = [
  ["招募概率", "recruitment_probability.json", "130级市值、13品质基础权重", 130],
  ["球队成长", "team_progression.json", "130级市值、球队等级与斗志曲线", 130],
  ["球员OVR", "player_ovr_ranges.json", "13品质OVR区间", 13],
  ["位置权重", "position_attribute_weights.json", "五位置五属性权重", 5],
  ["经济配置", "economy.json", "预算、招募、广告与离线收益规则", "键值配置"],
  ["管理升级成本", "economy.json", "管理层关键等级升级预算；完整逐级值以JSON为准", "关键等级"],
  ["管理层效果", "management_effects.json", "五管理岗位关键等级效果；完整逐级值以JSON为准", "关键等级"],
  ["比赛奖励", "match_rewards.json", "13赛季逐场奖励汇总；完整1274场以JSON为准", 13],
  ["赛季成就", "season_achievements.json", "13品质全胜冠军成就", 13],
  ["赛季难度", "season_pacing.json", "13赛季常规赛及季后赛难度", 13],
  ["赛季规则", "season_pacing.json", "比赛、比分、赛程和无限模式规则", "键值配置"],
  ["概念神保底", "concept_god_recruitment.json", "GOAT计数保底门槛", 13],
  ["概念神数值", "concept_god_values.json", "动态数值、MAX与毕业规则", "键值配置"],
  ["球员池", "player_pool.json", "品质数量及NBA/CBA构成", "键值配置"],
  ["概念神池", "../concept_god_pool.json", "概念神名单及定义", 48],
].map(x => ({ 工作表: x[0], 来源文件: x[1], 内容: x[2], 数据行数: x[3], 状态: "当前JSON真源" }));
const index = addTableSheet("配置索引", "篮球游戏数值配置表", "GDD.md + data/balance/*.json", indexRows, ["工作表", "来源文件", "内容", "数据行数", "状态"]);
index.getRange("A1:E1").format.fill = theme.gold;
index.getRange("A1:E1").format.font = { bold: true, color: "#3D2B00", size: 16 };

// 招募概率与品质
const recruit = data["recruitment_probability.json"];
const qualityNames = recruit.qualities.map(q => qualityNameById[q.qualityId] ?? q.qualityName);
const recruitRows = recruit.marketValueLevels.map(x => {
  const localLevel = ((x.level - 1) % 10) + 1;
  const r = {
    市值等级: x.level, 阶段名: `${qualityNameById[x.segmentQualityId] ?? x.segmentQualityName} Lv.${localLevel}`, 品质段: x.qualityBand,
    当前段品质ID: x.segmentQualityId, 当前段品质: qualityNameById[x.segmentQualityId] ?? x.segmentQualityName,
    可招募品质ID: x.recruitableQualityIds.join("|"), 可招募品质: x.recruitableQualityIds.map(id => qualityNameById[id] ?? id).join("|"),
    最高品质ID: x.highestUnlockedQualityId, 最高品质: qualityNameById[x.highestUnlockedQualityId] ?? x.highestUnlockedQualityName,
  };
  qualityNames.forEach((n, i) => r[`${n}权重`] = x.baseWeights[i] ?? 0);
  return r;
});
addTableSheet("招募概率", "130级市值招募品质权重", "recruitment_probability.json / marketValueLevels", recruitRows);
addTableSheet("品质定义", "球员品质定义", "GDD 4.3 + recruitment_probability.json / qualities", recruit.qualities.map(x => ({ qualityId: x.qualityId, qualityName: qualityNameById[x.qualityId] ?? x.qualityName })));

// 球队成长
const team = data["team_progression.json"];
const teamRows = team.marketValueLevels.map(x => ({
  市值等级: x.marketValueLevel, 球队等级起点: x.teamLevelStart, 球队等级上限: x.teamLevelCap,
  本阶段球队等级数: x.teamLevelsInStage,
  斗志需求1: x.willpowerRequirements?.[0] ?? "", 斗志需求2: x.willpowerRequirements?.[1] ?? "",
  斗志需求3: x.willpowerRequirements?.[2] ?? "", 斗志需求4: x.willpowerRequirements?.[3] ?? "",
  升满总斗志: x.totalWillpowerToCap, 预计招募次数: x.estimatedRecruitCountToCap,
  晋级条件: x.promotionCondition, 管理层等级上限: x.managementLevelCeilingAtStageEnd,
}));
addTableSheet("球队成长", "球队等级、斗志与管理层上限", "team_progression.json / marketValueLevels", teamRows);

addTableSheet("球员OVR", "各品质球员OVR区间", "player_ovr_ranges.json / ranges", data["player_ovr_ranges.json"].ranges.map(x => flattenRecord(x)));
addTableSheet("位置权重", "五位置属性生成权重", "position_attribute_weights.json / positions", data["position_attribute_weights.json"].positions.map(x => flattenRecord(x)));

// 经济配置与管理层
const economy = data["economy.json"];
addTableSheet("经济配置", "经济产出、消耗与广告配置", "economy.json", flattenSettings(economy, "", [], new Set(["managementUpgradeCost.upgradeCostToNextLevel"])));
const keyLevel = x => x <= 20 || x % 20 === 0 || x === 519 || x === 520;
const costRows = economy.managementUpgradeCost.upgradeCostToNextLevel.filter(x => keyLevel(x.fromLevel)).map(x => flattenRecord(x));
addTableSheet("管理升级成本", "管理层关键等级升级预算成本（完整逐级值见JSON）", "economy.json / managementUpgradeCost.upgradeCostToNextLevel", costRows);
const mgmtRows = data["management_effects.json"].levelEffects.filter(x => keyLevel(x.managementLevel)).map(x => flattenRecord(x));
const mgmtSheet = addTableSheet("管理层效果", "五类管理层关键等级效果（完整逐级值见JSON）", "management_effects.json / levelEffects", mgmtRows);
mgmtSheet.getRange(`B5:F${mgmtRows.length + 4}`).format.numberFormat = "0.00%";

// 比赛奖励
const rewardRows = data["match_rewards.json"].seasons.map(s => ({
  赛季: s.seasonNumber, 难度品质ID: s.difficultyQualityId, 难度品质: s.difficultyQualityName,
  配置场次数: s.matches.length,
  起始对手OVR: s.matches[0]?.opponentOvr ?? "", 结束对手OVR: s.matches.at(-1)?.opponentOvr ?? "",
  最低预算奖励: Math.min(...s.matches.map(x => x.baseBudgetReward)),
  最高预算奖励: Math.max(...s.matches.map(x => x.baseBudgetReward)),
  赛季预算奖励合计: s.matches.reduce((a, x) => a + x.baseBudgetReward, 0),
}));
addTableSheet("比赛奖励", "13赛季比赛奖励汇总（完整1274场见JSON）", "match_rewards.json / seasons[].matches[]", rewardRows);

addTableSheet("赛季成就", "赛季全胜冠军成就", "season_achievements.json / achievements", data["season_achievements.json"].achievements.map(x => flattenRecord(x)));

// 赛季难度与规则
const pacing = data["season_pacing.json"];
const pacingRows = pacing.seasonDifficultyBySeason.map(x => ({
  赛季: x.seasonNumber, 难度品质ID: x.difficultyQualityId, 难度品质: x.difficultyQualityName,
  单卡OVR最小: x.qualitySingleCardOvrRange.min, 单卡OVR最大: x.qualitySingleCardOvrRange.max,
  常规赛起始OVR: x.regularSeasonOpponentOvr.start, 常规赛结束OVR: x.regularSeasonOpponentOvr.end,
  首轮OVR: x.playoffOpponentOvrByRound.firstRound, 次轮OVR: x.playoffOpponentOvrByRound.secondRound,
  分区决赛OVR: x.playoffOpponentOvrByRound.conferenceFinals, 总决赛OVR: x.playoffOpponentOvrByRound.finals,
  总决赛计算口径: x.finalsTeamOvrBasis,
}));
addTableSheet("赛季难度", "13赛季对手OVR曲线", "season_pacing.json / seasonDifficultyBySeason", pacingRows);
addTableSheet("赛季规则", "比赛、比分、赛程及无限模式规则", "season_pacing.json", flattenSettings(pacing, "", [], new Set(["seasonDifficultyBySeason", "seasonDifficultyQualitySequence"])));

// 概念神
addTableSheet("概念神保底", "概念神GOAT计数保底门槛", "concept_god_recruitment.json / thresholdsByCurrentLineupCount", data["concept_god_recruitment.json"].thresholdsByCurrentLineupCount.map(x => flattenRecord(x)));
addTableSheet("概念神数值", "概念神动态数值与毕业规则", "concept_god_values.json", flattenSettings(data["concept_god_values.json"]));
addTableSheet("球员池", "球员池数量与特殊规则", "player_pool.json", flattenSettings(data["player_pool.json"]));
addTableSheet("概念神池", "概念神招募池", "../concept_god_pool.json / conceptGods", data["concept_god_pool.json"].conceptGods.map(x => flattenRecord(x)));

console.log("workbook-built", wb.worksheets.items.length);
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(outputPath);
console.log(JSON.stringify({ outputPath, sheetCount: wb.worksheets.items.length, rewardRows: rewardRows.length, recruitRows: recruitRows.length, teamRows: teamRows.length }, null, 2));
