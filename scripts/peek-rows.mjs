// Print the last N data rows of a tab.  node scripts/peek-rows.mjs "Giao Dịch" 6
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readRows } from "../src/sheets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {
  GOOGLE_SERVICE_ACCOUNT: readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"),
  SHEET_ID: process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY",
};
const tab = process.argv[2] || "Giao Dịch";
const n = parseInt(process.argv[3] || "6", 10);

const rows = await readRows(env, tab, 0);
console.log(`"${tab}" total data rows: ${rows.length}`);
console.log(`Last ${n}:`);
rows.slice(-n).forEach((r, i) => console.log(`  [${rows.length - n + i + 1}]`, JSON.stringify(r)));
