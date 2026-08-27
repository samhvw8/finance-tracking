// Google Sheets data layer for the Worker.
//
// Replaces SheetDB while preserving its contract:
//   - reads return an array of row-objects keyed by the sheet's header row
//   - writes accept row-objects keyed by header name and are placed into the
//     matching columns regardless of order (extra keys ignored, missing -> "")
//
// Writes use valueInputOption=USER_ENTERED so the formula strings the app
// sends (e.g. =TEXT(...), =IFERROR(INDEX(...))) are evaluated by Sheets,
// exactly as SheetDB did.

import { getAccessToken } from "./google-auth.mjs";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

// Quote a sheet/tab name for A1 notation (needed for spaces & unicode).
function quoteSheet(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

async function accessToken(env) {
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
  return getAccessToken(sa, [SHEETS_SCOPE]);
}

async function sheetsFetch(env, token, path, init) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init && init.headers),
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Sheets ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Read a whole tab and zip rows against the header row.
export async function readRows(env, sheet, limit) {
  const token = await accessToken(env);
  const range = encodeURIComponent(quoteSheet(sheet));
  const data = await sheetsFetch(env, token, `/values/${range}?majorDimension=ROWS`);

  const values = data.values || [];
  if (values.length === 0) return [];

  const headers = values[0].map((h) => String(h).trim());
  let rows = values.slice(1);
  if (limit && limit > 0) rows = rows.slice(0, limit);

  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      obj[h] = row[i] != null ? row[i] : "";
    });
    return obj;
  });
}

// Append one or more row-objects, mapping keys -> header columns.
export async function appendRows(env, sheet, dataObjects) {
  const token = await accessToken(env);

  // Read the header row to learn the column order.
  const headerRange = encodeURIComponent(`${quoteSheet(sheet)}!1:1`);
  const hData = await sheetsFetch(env, token, `/values/${headerRange}`);
  const headers = (hData.values && hData.values[0] ? hData.values[0] : []).map(
    (h) => String(h).trim()
  );
  if (headers.length === 0) {
    throw new Error(`Sheet "${sheet}" has no header row`);
  }

  const values = dataObjects.map((obj) => {
    const norm = {};
    Object.keys(obj || {}).forEach((k) => {
      norm[String(k).trim()] = obj[k];
    });
    return headers.map((h) => (h && norm[h] != null ? norm[h] : ""));
  });

  const range = encodeURIComponent(`${quoteSheet(sheet)}!A1`);
  const result = await sheetsFetch(
    env,
    token,
    `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    }
  );

  return {
    created: values.length,
    updatedRange: result.updates?.updatedRange || "",
  };
}
