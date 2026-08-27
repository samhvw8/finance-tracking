// Harden Balance Sheet A:K budget block: replace fixed pivot-column references
// (N/P/R/S/T/U) with SUMIFS keyed on the month (col L), so QUERY...PIVOT column
// order can never misalign it. Pivots (L/Q) are left untouched for display.
//
// The jar caps are driven by the month's *budget base*, which is income PLUS any
// "Rút Tiền Ra Tài Khoản" (cash pulled back out of an investment account).
// Money IN consumes the Save jar (col H); money OUT has to come back somewhere,
// otherwise it is spendable cash the block cannot see. The five percentages in
// 'Setup Finanace'!G7:G11 sum to 1.0, so crediting it to the base returns the
// full amount to the Surplus, split 50/25/10/10/5 across the jars.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);

const D = `'Giao Dịch'`;
const NN = `${D}!$A:$A,"<>"`; // match the pivots' "A IS NOT NULL" (Date not blank)
const income = (r) => `SUMIFS(${D}!$E:$E,${D}!$B:$B,"Thu Nhập",${D}!$G:$G,$L${r},${NN})`;
const save = (r) => `SUMIFS(${D}!$E:$E,${D}!$B:$B,"Chuyển Tiền Vào Tài Khoản",${D}!$G:$G,$L${r},${NN})`;
const withdraw = (r) => `SUMIFS(${D}!$E:$E,${D}!$B:$B,"Rút Tiền Ra Tài Khoản",${D}!$G:$G,$L${r},${NN})`;
// What the jar caps are a percentage of: income earned + cash withdrawn back out.
const base = (r) => `(${income(r)})+(${withdraw(r)})`;
const grp = (r, g) => `SUMIFS(${D}!$E:$E,${D}!$B:$B,"Chi Tiêu",${D}!$H:$H,"${g}",${D}!$G:$G,$L${r},${NN})`;
const S = `'Setup Finanace'`;

const rows = [];
for (let r = 2; r <= 20; r++) {
  const g = (x) => `IF($L${r}="","",${x})`; // blank when the month row is empty
  rows.push([
    g(`$B${r}+$D${r}+$F${r}+$H${r}+$J${r}`),            // A Surplus
    g(`$C${r}-(${grp(r, "Donate")})`),                  // B Donate Balance
    g(`(${base(r)})*${S}!$G$11`),                      // C Donate Cap
    g(`$E${r}-(${grp(r, "Development")})`),              // D Dev Balance
    g(`(${base(r)})*${S}!$G$10`),                      // E Dev Cap
    g(`$G${r}-(${grp(r, "Reward")})`),                  // F Reward Balance
    g(`(${base(r)})*${S}!$G$9`),                       // G Reward Cap
    g(`$I${r}-(${save(r)})`),                           // H Save Balance
    g(`(${base(r)})*${S}!$G$8`),                       // I Save Cap
    g(`$K${r}-(${grp(r, "Essential")})`),               // J Essential Balance
    g(`(${base(r)})*${S}!$G$7`),                       // K Essential Cap
  ].map((f) => "=" + f));
}

const res = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("'Balance Sheet'!A2:K20")}?valueInputOption=USER_ENTERED`,
  {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  }
);
console.log(res.ok ? `✅ rewrote A2:K20 (${rows.length} month rows) — pivot-independent` : `❌ ${res.status} ${await res.text()}`);
