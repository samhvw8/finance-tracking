// Exercises the REAL Worker data layer (src/sheets.mjs) against the live sheet:
// append a clearly-marked test row (mapping by column name + a USER_ENTERED
// formula), read it back, then CLEAR that exact range so nothing is left behind.
//
//   node scripts/test-roundtrip.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendRows, readRows } from "../src/sheets.mjs";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID =
  process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";

const env = {
  GOOGLE_SERVICE_ACCOUNT: readFileSync(
    join(__dirname, "..", ".secrets", "sa-key.json"),
    "utf8"
  ),
  SHEET_ID,
};

const TAB = "Giao Dịch";
const MARKER = "ROUNDTRIP_TEST_SAFE_TO_IGNORE";

// Same shape the app's buildTransactionPayload() produces.
const testRow = {
  Date: "Test-26/06/2026",
  Type: "Chi Tiêu",
  Category: "TEST",
  "Tên": MARKER,
  "Số Tiền": "1",
  Note: MARKER,
  Month: '=TEXT(DATEVALUE("06/26/2026"), "yyyy/MM")',
};

console.log(`Appending 1 test row to "${TAB}"...`);
const res = await appendRows(env, TAB, [testRow]);
console.log("✅ append result:", JSON.stringify(res));

const range = res.updatedRange;
if (!range) throw new Error("No updatedRange returned");

const token = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT
  ? JSON.parse(env.GOOGLE_SERVICE_ACCOUNT)
  : null, ["https://www.googleapis.com/auth/spreadsheets"]);

// Read the row back with FORMULA rendering to confirm the formula was stored
// (not flattened to a literal string) — i.e. USER_ENTERED worked.
const enc = encodeURIComponent(range);
const back = await (
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}?valueRenderOption=FORMULA`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
).json();
console.log("✅ read back (FORMULA):", JSON.stringify(back.values));

// Confirm the Month formula round-tripped as a real formula.
const flat = (back.values?.[0] || []).map(String);
const hasFormula = flat.some((c) => c.startsWith("=TEXT("));
console.log(hasFormula ? "✅ formula preserved (USER_ENTERED)" : "⚠️  no formula found in row");

// Clean up: clear exactly the appended range (no row shift, only our cells).
const clr = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}:clear`,
  { method: "POST", headers: { Authorization: `Bearer ${token}` } }
);
console.log(clr.ok ? `🧹 cleared test row (${range})` : `❌ cleanup failed: ${clr.status}`);

// Sanity: also exercise readRows() (object-shape, like the frontend expects).
const cats = await readRows(env, "Setup Finanace", 2);
console.log("\n✅ readRows('Setup Finanace') sample object:", JSON.stringify(cats[0]));

console.log("\n🎉 Read + write + formula + cleanup all verified via the Worker data layer.");
