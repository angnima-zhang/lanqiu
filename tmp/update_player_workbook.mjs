import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "D:/篮球/data/balance/篮球游戏数值配置表.xlsx";
const outputDir = "D:/篮球/outputs/concept_god_goat_templates";
const outputPath = `${outputDir}/篮球游戏数值配置表.xlsx`;
await fs.mkdir(outputDir, { recursive: true });
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const before = await workbook.render({
  sheetName: "球员池",
  range: "A1:C19",
  scale: 2,
  format: "png",
});
await fs.writeFile(
  "D:/篮球/tmp/player_pool_before.png",
  new Uint8Array(await before.arrayBuffer()),
);

const sheet = workbook.worksheets.getItem("球员池");
sheet.getRange("A16:C17").copyTo(sheet.getRange("A18:C19"), "all");
sheet.getRange("A7:C19").values = [
  ["qualityCount", 13, "number"],
  ["cardsPerQuality", 102, "number"],
  ["goatCards", 112, "number"],
  ["nbaCardsPerQuality", 81, "number"],
  ["goatNbaCards", 91, "number"],
  ["cbaCardsPerQuality", 21, "number"],
  ["totalCards", 1336, "number"],
  ["chineseSpecialRules.availableInAllQualities", true, "boolean"],
  ["chineseSpecialRules.goatAttributes.scoring", 1000, "number"],
  ["chineseSpecialRules.goatAttributes.rebound", 550, "number"],
  ["chineseSpecialRules.goatAttributes.assist", 300, "number"],
  ["chineseSpecialRules.goatAttributes.steal", 110, "number"],
  ["chineseSpecialRules.goatAttributes.block", 170, "number"],
];
const conceptSheet = workbook.worksheets.getItem("概念神池");
conceptSheet.getRange("E51:F52").values = [
  ["马健", true],
  ["张卫平", true],
];

const check = await workbook.inspect({
  kind: "table",
  range: "球员池!A7:C19",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 5,
  maxChars: 4000,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 4000,
  summary: "formula error scan",
});
console.log(errors.ndjson);

const after = await workbook.render({
  sheetName: "球员池",
  range: "A1:C19",
  scale: 2,
  format: "png",
});
await fs.writeFile(
    "D:/篮球/tmp/player_pool_after.png",
    new Uint8Array(await after.arrayBuffer()),
);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 10000,
});
for (const [index, worksheet] of workbook.worksheets.items.entries()) {
  const preview = await workbook.render({
    sheetName: worksheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    `${outputDir}/verify_${String(index + 1).padStart(2, "0")}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}
console.log(sheets.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`saved ${outputPath}`);
