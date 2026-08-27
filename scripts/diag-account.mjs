// Diagnose the #N/A in Investment Account G/H/I by testing each SUMIFS term.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);
const api = (path, method, body) =>
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const tests = [
  [`=SUMIFS('Giao Dịch'!E:E,'Giao Dịch'!B:B,"Chuyển Tiền Vào Tài Khoản",'Giao Dịch'!C:C,B2)`],   // transfers IN by name
  [`=SUMIFS('Giao Dịch'!E:E,'Giao Dịch'!B:B,"Rút Tiền Ra Tài Khoản",'Giao Dịch'!C:C,B2)`],         // transfers OUT by name
  [`=SUMIFS('Giao Dịch Investment'!K:K,'Giao Dịch Investment'!B:B,B2)`],                            // old broken K term
  [`=SUMIFS('Giao Dịch Investment'!I:I,'Giao Dịch Investment'!B:B,A2)`],                            // realized P&L by ID
];
await api(`/values/${encodeURIComponent("'Investment Account'!L1:L4")}?valueInputOption=USER_ENTERED`, "PUT", { values: tests });
const r = await (await api(`/values/${encodeURIComponent("'Investment Account'!L1:L4")}?valueRenderOption=UNFORMATTED_VALUE`, "GET")).json();
console.log("L1 transfers IN (by name) :", JSON.stringify(r.values?.[0]));
console.log("L2 transfers OUT (by name):", JSON.stringify(r.values?.[1]));
console.log("L3 K-col term (by name)   :", JSON.stringify(r.values?.[2]));
console.log("L4 realized P&L (by ID)   :", JSON.stringify(r.values?.[3]));
await api(`/values/${encodeURIComponent("'Investment Account'!L1:L4")}:clear`, "POST", {});
console.log("(cleaned up L1:L4)");
