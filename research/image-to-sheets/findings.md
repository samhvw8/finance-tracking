# image to sheets findings

Research for Phase 4 (capture image → store → show in Google Sheet). Consumer Gmail project (`family-apps-samhv`, personal `@gmail.com`), Cloudflare Worker backend.

## Storage: can the service account upload to Drive?

| Finding | Verdict | Source |
|---|---|---|
| Service accounts have **0 Drive quota, can't own files** → upload = `storageQuotaExceeded` (403) | Confirmed (recent policy) | [Drive API limits](https://developers.google.com/workspace/drive/api/guides/limits), [gspread #1592](https://github.com/burnash/gspread/issues/1592) |
| Upload into a **user-shared folder** still fails (file owned by SA) | Confirmed | [gspread #1592](https://github.com/burnash/gspread/issues/1592) |
| **Shared Drives** + **domain-wide delegation** need Google Workspace | Unavailable on consumer Gmail | [Shared drives](https://support.google.com/a/users/answer/9310249) |
| Binary (image) ownership **can't be transferred** to a user | Confirmed | [Drive ownership](https://support.google.com/drive/answer/2494892) |
| **User OAuth2 refresh token** (offline, scope `drive.file`) → Worker uploads as the user (their 15GB) | Only viable real-Drive path | [OAuth web-server](https://developers.google.com/identity/protocols/oauth2/web-server) |
| **Cloudflare R2** (already on Cloudflare) → public URL | Simplest alternative | — |

## Display: showing the image in a Sheet cell

| Finding | Verdict | Source |
|---|---|---|
| `=IMAGE("url")` needs a **public, HTTPS, direct-image** URL | Required | [IMAGE help](https://support.google.com/docs/answer/3093333) |
| Official docs **forbid `drive.google.com` URLs**; most Drive forms broke ~early 2024 (403) | Confirmed | [IMAGE help](https://support.google.com/docs/answer/3093333), [issue 319531488](https://issuetracker.google.com/issues/319531488) |
| `drive.google.com/thumbnail?id=…&sz=w…` = only semi-working Drive form (unstable) | Flaky | [techontoes 2024](https://techontoes.com/2024/04/20/problem-to-show-thumbnails-of-images-hosted-on-google-drive-in-the-google-sheets/) |
| Writing `=IMAGE()` via Sheets API with `valueInputOption=USER_ENTERED` renders | Works (we already use USER_ENTERED) | [ValueInputOption](https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption) |
| **No native in-cell image** in REST API; only Apps Script `CellImage` (base64) | Confirmed | [CellImage](https://developers.google.com/apps-script/reference/spreadsheet/cell-image), [issue 157888759](https://issuetracker.google.com/issues/157888759) |

## Conclusion

- A **public non-Drive URL + `=IMAGE(url)`** is the only reliable in-cell display path.
- Real Google Drive storage requires **user OAuth** (not the service account) — and even then, Drive URLs don't render well in `=IMAGE()`, so display still needs a public mirror/proxy.
- Since we're already on Cloudflare, **R2 → public URL → `=IMAGE()`** is the lowest-risk path; Drive is achievable but adds an OAuth flow and still needs a public URL for display.

## Related

- [../../CLAUDE.md](../../CLAUDE.md) — project overview
