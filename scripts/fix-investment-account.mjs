// Fix the broken (#N/A) calculated columns in Investment Account:
//   G Current Balance = Net Invested (Buy value - Sell value, from detailed data)
//   H Total P&L       = Realized P&L (Giao Dịch Investment col I)
//   I ROI %           = Realized P&L / total bought  (blank if no buys)
// Dynamic (MAP over account IDs) + IFERROR so it never errors and auto-covers
// new accounts.
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
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const IDS = `FILTER($A$2:$A,$A$2:$A<>"")`;
const buyV = `SUMIFS('Giao Dịch Investment'!$G:$G,'Giao Dịch Investment'!$B:$B,id,'Giao Dịch Investment'!$C:$C,"Buy")`;
const sellV = `SUMIFS('Giao Dịch Investment'!$G:$G,'Giao Dịch Investment'!$B:$B,id,'Giao Dịch Investment'!$C:$C,"Sell")`;
const pl = `SUMIFS('Giao Dịch Investment'!$I:$I,'Giao Dịch Investment'!$B:$B,id)`;

await api(`/values/${encodeURIComponent("'Investment Account'!G2:I40")}:clear`, "POST", {});
const data = [
  { range: "'Investment Account'!G2", values: [[`=MAP(${IDS},LAMBDA(id,IFERROR((${buyV})-(${sellV}),0)))`]] },
  { range: "'Investment Account'!H2", values: [[`=MAP(${IDS},LAMBDA(id,IFERROR(${pl},0)))`]] },
  { range: "'Investment Account'!I2", values: [[`=MAP(${IDS},LAMBDA(id,IFERROR(${pl}/(${buyV}),"")))`]] },
];
const v = await api(`/values:batchUpdate`, "POST", { valueInputOption: "USER_ENTERED", data });
console.log(v.ok ? "✅ G/H/I rebuilt" : `❌ ${v.status} ${await v.text()}`);

const meta = await (await api(`?fields=sheets.properties`, "GET")).json();
const gid = meta.sheets.find((s) => s.properties.title === "Investment Account").properties.sheetId;
await api(`:batchUpdate`, "POST", { requests: [
  { repeatCell: { range: { sheetId: gid, startRowIndex: 1, endRowIndex: 40, startColumnIndex: 6, endColumnIndex: 8 },
      cell: { userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" } } }, fields: "userEnteredFormat.numberFormat" } },
  { repeatCell: { range: { sheetId: gid, startRowIndex: 1, endRowIndex: 40, startColumnIndex: 8, endColumnIndex: 9 },
      cell: { userEnteredFormat: { numberFormat: { type: "PERCENT", pattern: "0.0%" } } }, fields: "userEnteredFormat.numberFormat" } },
] });
console.log("✅ formatting applied");
