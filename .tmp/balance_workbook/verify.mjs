import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const file = "D:/篮球/data/balance/篮球游戏数值配置表.xlsx";
const previewDir = "D:/篮球/.tmp/balance_workbook/previews";
await fs.mkdir(previewDir, { recursive: true });
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
const sheets = wb.worksheets.items.map(s => s.name);
console.log(JSON.stringify({ sheetCount: sheets.length, sheets }, null, 2));

for (const name of sheets) {
  const sheet = wb.worksheets.getItem(name);
  const used = sheet.getUsedRange();
  const preview = await wb.render({ sheetName: name, range: `A1:${name === "招募概率" ? "L18" : "H18"}`, scale: 0.8, format: "png" });
  await fs.writeFile(path.join(previewDir, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
  console.log(name, used?.address ?? "no-range");
}

const key = await wb.inspect({ kind: "table", range: "配置索引!A1:E19", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 8, maxChars: 6000 });
await fs.writeFile(path.join(previewDir, "index-inspect.ndjson"), key.ndjson, "utf8");
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "formula error scan" });
await fs.writeFile(path.join(previewDir, "errors.ndjson"), errors.ndjson, "utf8");
console.log("error-scan", errors.ndjson);
