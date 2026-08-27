// Enhance "This Month Summary": % of spending column, percent format,
// bold header/total rows, and red highlight for over-budget (negative) balances.
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

// 1) Find the tab's sheetId (gid)
const meta = await (await api(`?fields=sheets.properties`, "GET")).json();
const gid = meta.sheets.find((s) => s.properties.title === "This Month Summary").properties.sheetId;

// 2) % of total spending column F (each category's Chi Tiêu / total Chi Tiêu)
const pct = [["% Chi Tiêu"]];
for (let r = 2; r <= 21; r++) pct.push([`=IFERROR(C${r}/$C$23,"")`]);
const v = await api(
  `/values/${encodeURIComponent("'This Month Summary'!F1:F21")}?valueInputOption=USER_ENTERED`,
  "PUT",
  { values: pct }
);
console.log(v.ok ? "✅ % column written" : `❌ pct ${v.status} ${await v.text()}`);

// 3) Formatting + conditional rule via batchUpdate
const requests = [
  // bold header row 1 (A1:F1)
  { repeatCell: { range: { sheetId: gid, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
      cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } },
  // bold total row 23 (A23:E23)
  { repeatCell: { range: { sheetId: gid, startRowIndex: 22, endRowIndex: 23, startColumnIndex: 0, endColumnIndex: 5 },
      cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } },
  // percent format F2:F21
  { repeatCell: { range: { sheetId: gid, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 5, endColumnIndex: 6 },
      cell: { userEnteredFormat: { numberFormat: { type: "PERCENT", pattern: "0.0%" } } }, fields: "userEnteredFormat.numberFormat" } },
  // red highlight when budget balance is negative (over budget): H16:H20
  { addConditionalFormatRule: { index: 0, rule: {
      ranges: [{ sheetId: gid, startRowIndex: 15, endRowIndex: 20, startColumnIndex: 7, endColumnIndex: 8 }],
      booleanRule: { condition: { type: "NUMBER_LESS", values: [{ userEnteredValue: "0" }] },
        format: { backgroundColor: { red: 0.96, green: 0.8, blue: 0.8 }, textFormat: { foregroundColor: { red: 0.6, green: 0, blue: 0 } } } } } } },
];
const b = await api(`:batchUpdate`, "POST", { requests });
console.log(b.ok ? "✅ formatting + conditional rule applied" : `❌ fmt ${b.status} ${await b.text()}`);
