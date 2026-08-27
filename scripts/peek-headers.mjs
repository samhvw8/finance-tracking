// Print the header row of a tab.  node scripts/peek-headers.mjs "Giao Dịch"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const tab = process.argv[2] || "Giao Dịch";

const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const range = encodeURIComponent(`'${tab.replace(/'/g, "''")}'!1:1`);
const r = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const d = await r.json();
const headers = d.values?.[0] || [];
console.log(`"${tab}" headers (${headers.length}):`);
headers.forEach((h, i) => console.log(`  ${String.fromCharCode(65 + i)} = ${JSON.stringify(h)}`));
