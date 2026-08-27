// Full chain: append a Giao Dịch row with =IMAGE() in the "Ảnh" column,
// confirm the formula lands in column I, then clear. Self-cleaning.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendRows } from "../src/sheets.mjs";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const env = {
  GOOGLE_SERVICE_ACCOUNT: readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"),
  SHEET_ID,
};
const url = "https://finance-tracking.ginz.workers.dev/img/receipts/2026-06-26/b7b81289-13ce-4d9e-9286-005d3a595b31.png";

const row = {
  Date: "Test-26/06/2026",
  Type: "Chi Tiêu",
  Category: "TEST",
  "Tên": "IMG_ROW_TEST_SAFE_TO_IGNORE",
  "Số Tiền": "1",
  Note: "auto-test",
  Month: '=TEXT(DATEVALUE("06/26/2026"), "yyyy/MM")',
  "Ảnh": `=HYPERLINK("${url}", IMAGE("${url}"))`,
};

const res = await appendRows(env, "Giao Dịch", [row]);
console.log("append:", JSON.stringify(res));

const token = await getAccessToken(JSON.parse(env.GOOGLE_SERVICE_ACCOUNT), [
  "https://www.googleapis.com/auth/spreadsheets",
]);
const enc = encodeURIComponent(res.updatedRange);
const back = await (
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}?valueRenderOption=FORMULA`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
).json();
const cells = (back.values?.[0] || []).map(String);
console.log("read back:", JSON.stringify(cells));
console.log(cells.some((c) => c.startsWith("=HYPERLINK(")) ? "✅ =HYPERLINK(…IMAGE…) landed in the Ảnh column" : "❌ no =HYPERLINK found");

await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}:clear`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
console.log(`🧹 cleared test row (${res.updatedRange})`);
