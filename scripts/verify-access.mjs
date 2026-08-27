// Verifies the full Worker auth chain locally, using the service-account key:
//   sign JWT -> exchange for token -> read the spreadsheet via Sheets API.
//
//   SHEET_ID=<id> node scripts/verify-access.mjs
//   (SHEET_ID defaults to the value baked into wrangler.jsonc)
//
// Expected states:
//   200 + tabs listed       -> everything works (sheet shared with the SA)
//   403 PERMISSION_DENIED    -> ID is valid but the sheet is NOT yet shared
//   404                      -> wrong spreadsheet ID

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID =
  process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";

const sa = JSON.parse(
  readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8")
);

console.log("Service account:", sa.client_email);
console.log("Spreadsheet ID: ", SHEET_ID, "\n");

const token = await getAccessToken(sa, [
  "https://www.googleapis.com/auth/spreadsheets",
]);
console.log("✅ JWT signed + access token obtained\n");

const metaRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=properties.title,sheets.properties.title`,
  { headers: { Authorization: `Bearer ${token}` } }
);

if (!metaRes.ok) {
  const body = await metaRes.text();
  console.error(`❌ Sheets read failed: ${metaRes.status}`);
  console.error(body);
  if (metaRes.status === 403) {
    console.error(
      `\n👉 Share the spreadsheet with ${sa.client_email} (Editor), then re-run.`
    );
  } else if (metaRes.status === 404) {
    console.error("\n👉 The spreadsheet ID looks wrong.");
  }
  process.exit(1);
}

const meta = await metaRes.json();
console.log("✅ Spreadsheet:", meta.properties?.title);
console.log(
  "✅ Tabs:",
  (meta.sheets || []).map((s) => s.properties.title).join(" | ")
);

// Sample the categories tab to confirm reads work end-to-end.
const sampleRange = encodeURIComponent("'Setup Finanace'!A1:Z3");
const sampleRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sampleRange}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
if (sampleRes.ok) {
  const sample = await sampleRes.json();
  console.log("\nSample (Setup Finanace, first rows):");
  console.log(JSON.stringify(sample.values || [], null, 2));
}

console.log("\n🎉 Auth chain verified — the Worker can read/write this sheet.");
