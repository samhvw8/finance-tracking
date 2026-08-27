// Read a range with FORMULA rendering. node scripts/read-range.mjs "Giao Dịch!A1363:I1366"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const range = process.argv[2] || "Giao Dịch!A1363:I1366";
const render = process.argv[3] || "FORMULA"; // FORMULA | FORMATTED_VALUE | UNFORMATTED_VALUE

const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const enc = encodeURIComponent(range);
const r = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}?valueRenderOption=${render}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const d = await r.json();
(d.values || []).forEach((row, i) => console.log(`row ${i}:`, JSON.stringify(row)));
