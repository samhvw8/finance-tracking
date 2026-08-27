// Make the H/I budget block in "This Month Summary" DYNAMIC: groups + cap% come
// from Setup Finanace F7:G13, so adding a budget group there flows through.
// Layout preserved (actuals H1:I6, income G9, caps H9:I13, balances H16:I20).
// "Save" actual = transfers to investment (preserved exactly).
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
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const GRP = `FILTER('Setup Finanace'!$F$7:$F$13,'Setup Finanace'!$F$7:$F$13<>"")`;
const ACTUAL = `IF(grp="Save",SUMIFS('Giao Dịch'!$E:$E,'Giao Dịch'!$G:$G,Dashboard!$C$2,'Giao Dịch'!$B:$B,"Chuyển Tiền Vào Tài Khoản"),SUMIFS('Giao Dịch'!$E:$E,'Giao Dịch'!$G:$G,Dashboard!$C$2,'Giao Dịch'!$H:$H,grp))`;
const CAP = `IF($G$9<>"",$G$9*IFERROR(VLOOKUP(grp,'Setup Finanace'!$F$7:$G$13,2,FALSE),0),"")`;
const CAP0 = `IF($G$9<>"",$G$9*IFERROR(VLOOKUP(grp,'Setup Finanace'!$F$7:$G$13,2,FALSE),0),0)`;

// Clear the block (keep income G9), then write spill anchors.
await api(`/values/${encodeURIComponent("'This Month Summary'!H1:I20")}:clear`, "POST", {});
const data = [
  { range: "'This Month Summary'!H1:I1", values: [["Category", "Chi Tiêu"]] },
  { range: "'This Month Summary'!H2", values: [[`=${GRP}`]] },
  { range: "'This Month Summary'!I2", values: [[`=MAP(${GRP},LAMBDA(grp,${ACTUAL}))`]] },
  { range: "'This Month Summary'!H9", values: [[`=MAP(${GRP},LAMBDA(grp,${CAP}))`]] },
  { range: "'This Month Summary'!I9", values: [[`=MAP(${GRP},LAMBDA(grp,grp&" Cap"))`]] },
  { range: "'This Month Summary'!H16", values: [[`=MAP(${GRP},LAMBDA(grp,(${CAP0})-(${ACTUAL})))`]] },
  { range: "'This Month Summary'!I16", values: [[`=MAP(${GRP},LAMBDA(grp,grp&" Balance"))`]] },
];
const v = await api(`/values:batchUpdate`, "POST", { valueInputOption: "USER_ENTERED", data });
console.log(v.ok ? "✅ dynamic budget block written" : `❌ ${v.status} ${await v.text()}`);
