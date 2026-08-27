// Replace the dynamic QUERY...PIVOT in "This Month Summary"!A1 with a
// FIXED-STRUCTURE grid (all categories x all 4 types via SUMIFS) so the layout
// never shifts and a missing category/type simply shows 0 — no manual seeding.
// A1 is unreferenced anywhere (verified), so replacing in place is safe.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getAccessToken } from "../src/google-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.env.SHEET_ID || "1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY";
const sa = JSON.parse(readFileSync(join(__dirname, "..", ".secrets", "sa-key.json"), "utf8"));
const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);

const TYPES = ["Thu Nhập", "Chi Tiêu", "Chuyển Tiền Vào Tài Khoản", "Rút Tiền Ra Tài Khoản"];
const CATEGORIES = [
  "Thuê Nhà", "Làm thêm", "Lương", "Khác", "Ngoài",
  "Đồ Ăn", "Chăm Sóc", "Mua Sắm", "Phương tiện", "Tiết Kiệm",
  "Thưởng", "Phát triển", "Từ Thiện", "Thiết Yếu",
  "Bitcoin", "Cổ phiếu Blue chip", "Cổ phiếu Việt Nam",
  "Kinh doanh", "Tiết kiệm Ngân Hàng", "Vàng",
];
const COLS = ["B", "C", "D", "E"]; // one per type

// cell(col, row) -> SUMIFS for that Type header (col$1) and Category label ($Arow)
const cell = (col, row) =>
  `=SUMIFS('Giao Dịch'!$E:$E, 'Giao Dịch'!$G:$G, Dashboard!$C$2, 'Giao Dịch'!$B:$B, ${col}$1, 'Giao Dịch'!$C:$C, $A${row})`;
// catch-all: this Type's true total minus the listed rows
const catchAll = (col) =>
  `=SUMIFS('Giao Dịch'!$E:$E, 'Giao Dịch'!$G:$G, Dashboard!$C$2, 'Giao Dịch'!$B:$B, ${col}$1) - SUM(${col}2:${col}21)`;

const rows = [];
rows.push(["Category", ...TYPES]); // row 1 headers
CATEGORIES.forEach((catName, i) => {
  const r = i + 2; // sheet row
  rows.push([catName, ...COLS.map((c) => cell(c, r))]);
});
rows.push(["Khác (chưa liệt kê)", ...COLS.map((c) => catchAll(c))]); // row 22
rows.push(["Tổng Cộng", ...COLS.map((c) => `=SUM(${c}2:${c}22)`)]); // row 23

const res = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent("'This Month Summary'!A1:E23")}?valueInputOption=USER_ENTERED`,
  {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  }
);
console.log(res.ok ? `✅ wrote fixed grid A1:E23 (${rows.length} rows)` : `❌ ${res.status} ${await res.text()}`);
