// Adds an image header column to a tab (idempotent).
//   node scripts/add-image-column.mjs "Giao Dịch" "Ảnh"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const tab = process.argv[2] || "Giao Dịch";
const label = process.argv[3] || "Ảnh";

const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const q = `'${tab.replace(/'/g, "''")}'`;

const r = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(q + "!1:1")}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const headers = ((await r.json()).values?.[0] || []).map((h) => String(h).trim());
if (headers.includes(label)) {
  console.log(`"${label}" column already exists in "${tab}" — nothing to do.`);
  process.exit(0);
}
const colLetter = String.fromCharCode(65 + headers.length); // next empty column
const cell = `${q}!${colLetter}1`;
const u = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(cell)}?valueInputOption=RAW`,
  {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[label]] }),
  }
);
if (!u.ok) {
  console.error("Failed:", u.status, await u.text());
  process.exit(1);
}
console.log(`✅ Added "${label}" header at ${tab}!${colLetter}1`);
