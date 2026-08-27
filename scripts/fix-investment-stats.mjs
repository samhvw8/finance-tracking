// Fix the "Investment stats" gold section so it counts ONLY gold (account
// INV003) — previously the USDT row (INV001) polluted the gold SUMPRODUCTs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);

const updates = [
  { range: "'Investment stats'!B16", values: [[`=COUNTIFS('Giao Dịch Investment'!C2:C999,"Buy",'Giao Dịch Investment'!B2:B999,"INV003")`]] },
  { range: "'Investment stats'!C16", values: [[`=COUNTIFS('Giao Dịch Investment'!C2:C999,"Sell",'Giao Dịch Investment'!B2:B999,"INV003")`]] },
  { range: "'Investment stats'!B17", values: [[`=SUMPRODUCT('Giao Dịch Investment'!$E$2:$E$999*('Giao Dịch Investment'!$C2:$C999="Buy")*('Giao Dịch Investment'!$B2:$B999="INV003"))`]] },
  { range: "'Investment stats'!C17", values: [[`=SUMPRODUCT('Giao Dịch Investment'!$E$2:$E$999*('Giao Dịch Investment'!$C2:$C999="Sell")*('Giao Dịch Investment'!$B2:$B999="INV003"))`]] },
  { range: "'Investment stats'!B18", values: [[`=SUMPRODUCT(('Giao Dịch Investment'!C2:C999="Buy")*('Giao Dịch Investment'!B2:B999="INV003")*('Giao Dịch Investment'!G2:G999))`]] },
  { range: "'Investment stats'!C18", values: [[`=SUMPRODUCT(('Giao Dịch Investment'!C2:C999="Sell")*('Giao Dịch Investment'!B2:B999="INV003")*('Giao Dịch Investment'!G2:G999))`]] },
];

const res = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
  }
);
console.log(res.ok ? `✅ updated ${updates.length} cells` : `❌ ${res.status} ${await res.text()}`);
