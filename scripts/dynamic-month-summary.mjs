// Make "This Month Summary" fully DYNAMIC: categories pulled from Setup Finanace
// (cols A-D, incl. auto-synced investment categories), type columns from Setup's
// header row. Add a category in Setup -> it appears here automatically. Columns
// stay fixed (the 4 types) so the layout never shifts; missing data = 0.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const api = (path, method, body) =>
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

// Dynamic category list: union of all 4 type-columns in Setup (stacked top-to-
// bottom so the order stays grouped: income -> expense -> investment), blanks removed.
const SRC = `{'Setup Finanace'!A2:A40;'Setup Finanace'!B2:B40;'Setup Finanace'!C2:C40;'Setup Finanace'!D2:D40}`;
const CATLIST = `UNIQUE(FILTER(${SRC},${SRC}<>""))`;
const total = (col) =>
  `=SUMIFS('Giao Dịch'!$E:$E,'Giao Dịch'!$G:$G,Dashboard!$C$2,'Giao Dịch'!$B:$B,${col}$1)`;
const colMap = (col) =>
  `=MAP(${CATLIST},LAMBDA(cat,SUMIFS('Giao Dịch'!$E:$E,'Giao Dịch'!$G:$G,Dashboard!$C$2,'Giao Dịch'!$B:$B,${col}$1,'Giao Dịch'!$C:$C,cat)))`;
const pctMap =
  `=MAP(${CATLIST},LAMBDA(cat,IFERROR(SUMIFS('Giao Dịch'!$E:$E,'Giao Dịch'!$G:$G,Dashboard!$C$2,'Giao Dịch'!$B:$B,$C$1,'Giao Dịch'!$C:$C,cat)/$C$2,"")))`;

const rows = [
  ["Category", "='Setup Finanace'!A1", "='Setup Finanace'!B1", "='Setup Finanace'!C1", "='Setup Finanace'!D1", "% Chi Tiêu"],
  ["TỔNG CỘNG", total("B"), total("C"), total("D"), total("E"), ""],
  [`=${CATLIST}`, colMap("B"), colMap("C"), colMap("D"), colMap("E"), pctMap],
];

// Clear the old static grid, then write the 3 anchor rows (spills fill the rest).
await api(`/values/${encodeURIComponent("'This Month Summary'!A1:F40")}:clear`, "POST", {});
const v = await api(
  `/values/${encodeURIComponent("'This Month Summary'!A1:F3")}?valueInputOption=USER_ENTERED`,
  "PUT",
  { values: rows }
);
console.log(v.ok ? "✅ dynamic grid written" : `❌ values ${v.status} ${await v.text()}`);

// Formatting
const meta = await (await api(`?fields=sheets.properties`, "GET")).json();
const gid = meta.sheets.find((s) => s.properties.title === "This Month Summary").properties.sheetId;
const requests = [
  { repeatCell: { range: { sheetId: gid, startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 6 },
      cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } },
  { repeatCell: { range: { sheetId: gid, startRowIndex: 1, endRowIndex: 45, startColumnIndex: 1, endColumnIndex: 5 },
      cell: { userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" } } }, fields: "userEnteredFormat.numberFormat" } },
  { repeatCell: { range: { sheetId: gid, startRowIndex: 2, endRowIndex: 45, startColumnIndex: 5, endColumnIndex: 6 },
      cell: { userEnteredFormat: { numberFormat: { type: "PERCENT", pattern: "0.0%" } } }, fields: "userEnteredFormat.numberFormat" } },
  { addConditionalFormatRule: { index: 0, rule: {
      ranges: [{ sheetId: gid, startRowIndex: 15, endRowIndex: 20, startColumnIndex: 7, endColumnIndex: 8 }],
      booleanRule: { condition: { type: "NUMBER_LESS", values: [{ userEnteredValue: "0" }] },
        format: { backgroundColor: { red: 0.96, green: 0.8, blue: 0.8 } } } } } },
];
const b = await api(`:batchUpdate`, "POST", { requests });
console.log(b.ok ? "✅ formatting applied" : `❌ fmt ${b.status} ${await b.text()}`);
