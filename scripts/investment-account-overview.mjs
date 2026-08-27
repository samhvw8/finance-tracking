// Add a dynamic "Portfolio by Account" overview to Investment stats (empty area
// at row 46). Data-driven over Investment Account -> covers every account/asset
// automatically (gold, USDT, future), so the stats reflect ALL holdings.
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

const ACC = `FILTER('Investment Account'!$A$2:$A$50,'Investment Account'!$A$2:$A$50<>"")`;
const buy = `SUMIFS('Giao Dịch Investment'!$G:$G,'Giao Dịch Investment'!$B:$B,a,'Giao Dịch Investment'!$C:$C,"Buy")`;
const sell = `SUMIFS('Giao Dịch Investment'!$G:$G,'Giao Dịch Investment'!$B:$B,a,'Giao Dịch Investment'!$C:$C,"Sell")`;

const data = [
  { range: "'Investment stats'!A46", values: [["🏦 TỔNG QUAN THEO TÀI KHOẢN (Tất cả giao dịch)"]] },
  { range: "'Investment stats'!A47:F47", values: [["Tài Khoản", "Tên", "Loại", "Mua (VNĐ)", "Bán (VNĐ)", "Ròng (VNĐ)"]] },
  { range: "'Investment stats'!A48", values: [[`=${ACC}`]] },
  { range: "'Investment stats'!B48", values: [[`=MAP(${ACC},LAMBDA(a,IFERROR(VLOOKUP(a,'Investment Account'!$A:$B,2,FALSE),"")))`]] },
  { range: "'Investment stats'!C48", values: [[`=MAP(${ACC},LAMBDA(a,IFERROR(VLOOKUP(a,'Investment Account'!$A:$D,4,FALSE),"")))`]] },
  { range: "'Investment stats'!D48", values: [[`=MAP(${ACC},LAMBDA(a,${buy}))`]] },
  { range: "'Investment stats'!E48", values: [[`=MAP(${ACC},LAMBDA(a,${sell}))`]] },
  { range: "'Investment stats'!F48", values: [[`=MAP(${ACC},LAMBDA(a,(${buy})-(${sell})))`]] },
];
const v = await api(`/values:batchUpdate`, "POST", { valueInputOption: "USER_ENTERED", data });
console.log(v.ok ? "✅ account overview written" : `❌ ${v.status} ${await v.text()}`);

// Format: bold title + header, thousands on D:F
const meta = await (await api(`?fields=sheets.properties`, "GET")).json();
const gid = meta.sheets.find((s) => s.properties.title === "Investment stats").properties.sheetId;
await api(`:batchUpdate`, "POST", { requests: [
  { repeatCell: { range: { sheetId: gid, startRowIndex: 45, endRowIndex: 47, startColumnIndex: 0, endColumnIndex: 6 },
      cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } },
  { repeatCell: { range: { sheetId: gid, startRowIndex: 47, endRowIndex: 70, startColumnIndex: 3, endColumnIndex: 6 },
      cell: { userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" } } }, fields: "userEnteredFormat.numberFormat" } },
] });
console.log("✅ formatting applied");
