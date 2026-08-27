// Write-only: SUMIFS vs QUERY-style total for 2025/04 Essential (read separately).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const op = process.argv[2] || "write";
const range = "'Balance Sheet'!AF1:AF3";
const api = (p, m, b) => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${p}`, {
  method: m, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });

if (op === "clear") {
  await api(`/values/${encodeURIComponent(range)}:clear`, "POST", {});
  console.log("cleared");
} else {
  await api(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, "PUT", { values: [
    [`=SUMIFS('Giao Dịch'!E:E,'Giao Dịch'!B:B,"Chi Tiêu",'Giao Dịch'!H:H,"Essential",'Giao Dịch'!G:G,"2025/04",'Giao Dịch'!A:A,"<>")`],
    [`=INDEX(QUERY(Giao_Dịch,"SELECT SUM(E) WHERE A IS NOT NULL AND B='Chi Tiêu' AND H='Essential' AND G='2025/04'"),2,1)`],
    [`=COUNTIFS('Giao Dịch'!B:B,"Chi Tiêu",'Giao Dịch'!H:H,"Essential",'Giao Dịch'!G:G,"2025/04")`],
  ] });
  console.log("written AF1=SUMIFS, AF2=QUERY-style, AF3=count");
}
