# Project Overview

This is a comprehensive finance tracking web application that allows users to manage both regular transactions and detailed investment transactions in Google Sheets. Data access goes through a Cloudflare Worker that talks to the Google Sheets API with a service account (SheetDB is no longer used). The app features:

- **Main Transactions**: Income, expenses, and account transfers with single and batch modes
- **Investment Tracking**: Detailed buy/sell transactions with asset tracking, fees, and P&L
- **Linked Transactions**: Automatically create cash flow transactions when recording investments
- **Dynamic Categories**: Categories loaded from Google Sheets for flexibility
- **Offline-First**: IndexedDB caching for offline use and smart recovery
- **Receipt Photos**: Capture/upload an image per transaction → stored in Cloudflare R2 → shown in-cell via `=IMAGE()`
- **Shared Password Gate**: A single shared password protects the Worker API
- **Mobile-Optimized**: Responsive design for both mobile and desktop devices
- **Cloudflare Workers Deployment**: One Worker serves the SPA + API, globally distributed

# API Integration

## Backend: Cloudflare Worker + Google Sheets API
The frontend (SPA) calls a same-origin Cloudflare Worker (`src/worker.js`) at `/api/*`. The Worker authenticates to the Google Sheets API with a **service account** (`finance-sheets-writer@family-apps-samhv.iam.gserviceaccount.com`), JWT signed via Web Crypto (`src/google-auth.mjs`). The sheet is owned by the user and shared with that service account. SheetDB is no longer used.

- Spreadsheet: `SHEET_ID` Worker var (the "Master <3" sheet — all tabs in one file)
- `GET  /api/rows?sheet=<tab>&limit=<n>` → array of row-objects keyed by header
- `POST /api/rows` `{ data: [rowObjects], sheet }` → appends rows (maps keys→columns; `valueInputOption=USER_ENTERED` so formulas evaluate)
- `POST /api/upload-image` `{ dataUrl }` → uploads to R2, returns `{ url }`
- `GET  /img/<key>` → serves the R2 image publicly (so `=IMAGE()` can render it)
- `POST /api/login` → validates the password
- Auth: every `/api/*` call carries the shared password as `Authorization: Bearer <password>`
- The service-account key (`GOOGLE_SERVICE_ACCOUNT`) and `APP_PASSWORD` are Worker **secrets** — never in the client

## Transaction Data Structure

The Google Sheet "Giao Dịch" has the following columns (A–I):
- **Date**: Transaction date (format: MM/dd/yyyy for sheet, display as "Day-dd/MM/yyyy")
- **Type**: Transaction type (Thu Nhập | Chi Tiêu | Chuyển Tiền Vào Tài Khoản | Rút Tiền Ra Tài Khoản)
- **Category**: Category based on type (loaded dynamically from Setup sheet)
- **Tên**: Transaction name/description
- **Số Tiền**: Amount (numbers without currency symbol for sheet, display with VND)
- **Note**: Optional notes
- **Month**: `=TEXT(...)` formula written by the app (yyyy/MM)
- **Chi Tiêu Category**: `=IFERROR(INDEX(...))` formula (expense rows only)
- **Ảnh**: `=HYPERLINK("<r2-url>", IMAGE("<r2-url>"))` — clickable receipt photo (optional)

## Category Setup Structure

The "Setup Finanace" sheet contains dynamic categories with columns:
- **Thu Nhập**: Income categories
- **Chi Tiêu**: Expense categories
- **Chuyển Tiền Vào Tài Khoản**: Transfer to investment account categories
- **Rút Tiền Ra Tài Khoản**: Withdraw from investment account categories

## Transaction Types (Vietnamese)
- Thu Nhập (Income)
- Chi Tiêu (Expense)
- Chuyển Tiền Vào Tài Khoản (Transfer to Investment Account)
- Rút Tiền Ra Tài Khoản (Withdraw from Investment Account)

## Investment Transaction Data Structure

The Google Sheet "Giao Dich Investment" has the following columns for detailed investment tracking:
- **Date**: Transaction date
- **Investment Account**: Account identifier (e.g., INV001)
- **Type**: Buy or Sell
- **Asset Name**: Name of the asset (e.g., VNM, BTC, TSLA)
- **Quantity**: Number of units
- **Price per Unit**: Price per unit in VND
- **Total Amount**: Total transaction amount (Quantity × Price per Unit)
- **Fees**: Transaction fees
- **Realized P&L**: Profit/Loss for sell transactions
- **Notes**: Optional notes

## API Request Example
```javascript
// Same-origin call to our Worker (not SheetDB). Password rides in the header.
fetch('/api/rows', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`
    },
    body: JSON.stringify({
        data: [{
            'Date': 'Thu-17/04/2025',
            'Type': 'Chi Tiêu',
            'Category': 'Mua Sắm',
            'Tên': 'Tiền Ảnh',
            'Số Tiền': '2127000',
            'Note': '',
            'Ảnh': '=HYPERLINK("https://.../uuid.jpg", IMAGE("https://.../uuid.jpg"))'
        }],
        sheet: 'Giao Dịch'
    })
})
```

# Development Commands

```bash
# Install dependencies
npm install

# Start the frontend dev server (Vite, HMR) — proxies /api to the local Worker
npm run dev

# In a second terminal: run the Worker locally (reads .dev.vars)
npm run dev:api

# Build for production
npm run build

# Deploy to Cloudflare Workers (build + wrangler deploy)
npm run deploy
```

> Requires Node 22 (wrangler v4). `.mise.toml` pins it. Local secrets live in
> `.dev.vars` (gitignored); the service-account key is `.secrets/sa-key.json`.

# Project Structure

```
finance-tracking/
├── src/
│   ├── worker.js             # Cloudflare Worker: serves SPA + /api/* + /img/* (R2)
│   ├── google-auth.mjs       # Service-account JWT signing (Web Crypto), isomorphic
│   ├── sheets.mjs            # Google Sheets read/append (by column name, USER_ENTERED)
│   ├── components/           # Reusable UI components
│   │   ├── UnifiedTransactionForm.jsx    # Unified form for single/batch transactions
│   │   ├── TransactionFormFields.jsx     # Shared form fields (includes ImageCapture)
│   │   ├── ImageCapture.jsx              # Camera/file capture + client-side downscale
│   │   ├── InvestmentTransactionForm.jsx # Investment transaction form (Buy/Sell)
│   │   ├── TokenSettings.jsx             # Password + category/account refresh UI
│   │   ├── DatePicker.jsx                # Date input component
│   │   ├── AmountInput.jsx               # Currency input with formatting
│   │   └── Sidebar.jsx                   # Navigation sidebar
│   ├── services/             # API integration and data management
│   │   ├── sheetdb.js                    # Worker API client (filename kept; no longer SheetDB)
│   │   ├── indexedDB.js                  # Browser storage service
│   │   ├── categoriesManager.js          # Dynamic category management
│   │   └── investmentAccountsManager.js  # Investment accounts management
│   ├── hooks/                # Custom React hooks
│   │   └── useTransactionForm.js         # Form state and logic hook
│   ├── utils/                # Utility functions
│   │   └── formatters.js                 # Currency and date formatting
│   ├── constants/            # App constants
│   │   └── categories.js                 # Transaction type constants
│   └── App.jsx               # Main application component
├── scripts/                  # SA utilities (verify-access, add-image-column, …)
├── public/                   # Static assets (built into dist/)
├── wrangler.jsonc            # Worker config (assets→dist, vars, r2_buckets, routes)
├── .dev.vars                 # Local Worker secrets (gitignored)
├── .secrets/sa-key.json      # Service-account key (gitignored)
└── package.json              # Project dependencies
```

# Key Implementation Notes

## Currency Formatting
- **Display**: Vietnamese Dong (VND) with ₫ symbol and thousand separators (e.g., "2,127,000 ₫")
- **Payload**: Plain numbers without formatting (e.g., "2127000")
- **Input**: Smart formatting with focus/blur states for better UX

## Date Handling
- **Display**: Vietnamese format "Day-DD/MM/YYYY" (e.g., "Thứ-17/04/2025")
- **Payload**: Google Sheets format "MM/DD/YYYY" (e.g., "04/17/2025")
- **Input**: Standard HTML5 date picker
- **Main Transactions**: Default to today's date, future dates allowed for scheduled transactions
- **Investment Transactions**: Default to today's date, future dates allowed

## Category Management
- **Dynamic Loading**: Categories fetched from "Setup Finanace" Google Sheet
- **Caching**: Stored in IndexedDB for offline use and performance
- **Real-time Updates**: Reload button to refresh from Google Sheets
- **Type Dependent**: Categories change based on transaction type selection

## Batch Processing
- **Queue System**: Add multiple transactions before submitting
- **Batch API**: Submit multiple transactions in single API call
- **Dual Mode**: Can add to queue OR save individual transactions immediately
- **Auto-save**: All queued transactions automatically saved to IndexedDB
- **Smart Recovery**: App automatically enters batch mode when unsaved transactions detected

## Form Validation
- Amount must be a positive number
- Date can be in the past, present, or future
- Name field is optional (defaults to empty string "" if not provided)
- Category field is optional (defaults to "Khác" if not selected)
- Note field is optional

## Investment Transactions
- **Separate Sheet**: Investment transactions are stored in "Giao Dich Investment" sheet
- **Detailed Tracking**: Track asset name, quantity, price per unit, fees, and realized P&L
- **Investment Accounts**: Support for multiple investment accounts (loaded from "Investment Account" sheet)
- **Transaction Types**: Buy (purchase assets) and Sell (liquidate assets)

## Linked Transaction Feature
When creating investment transactions, users can optionally create a linked transaction in the main "Giao Dịch" sheet:

- **Purpose**: Track cash flow impact in main transaction sheet while maintaining detailed investment records
- **Buy Transactions**: Creates "Chuyển Tiền Vào Tài Khoản" (Transfer to Investment Account) transaction
- **Sell Transactions**: Creates "Rút Tiền Ra Tài Khoản" (Withdraw from Investment Account) transaction
- **Auto-populate**: Linked transaction automatically uses same date, amount, and notes as investment transaction
- **Category**: Uses asset name as the category in main transaction
- **Checkbox Control**: Feature can be enabled/disabled via checkbox in investment form
- **Batch Support**: Works in both single transaction and batch modes

## Receipt Photos (Images)
- **Capture**: `ImageCapture.jsx` — file input with `capture="environment"` (camera on mobile); downscaled client-side (canvas, max 1024px, JPEG 0.7) to a data URL.
- **Upload**: on submit the data URL is POSTed to `/api/upload-image`; the Worker stores it in R2 (`finance-tracking-images`) at `receipts/<date>/<uuid>.<ext>` and returns a public URL.
- **Display**: the app writes `=HYPERLINK("<url>", IMAGE("<url>"))` into the "Ảnh" column — a clickable thumbnail that opens the full image in a new tab. (`=IMAGE()` needs a public, non-Drive, direct-image URL — hence R2 + the public `/img/` route.)
- **URL security**: `/img/<key>` is public (Google's servers must fetch it for `=IMAGE()`). Protection is the **unguessable UUID** key (a capability URL): not enumerable/listable, only ever appears in your private sheet. Expiring/auth tokens are incompatible with `=IMAGE()` (the sheet stores a permanent URL). To revoke an image, delete the R2 object.
- **Scope**: currently on the main transaction form; the investment form can adopt the same pattern.

## Password & Secrets
- **Shared Password Gate**: A single password protects the Worker API. Set it in the UI (sidebar settings → "Mật Khẩu", masked); stored in IndexedDB and sent as `Authorization: Bearer <password>` on every `/api/*` call. Falls back to `VITE_APP_PASSWORD` if set.
- **Server-side secrets**: `GOOGLE_SERVICE_ACCOUNT` (the SA key) and `APP_PASSWORD` live only as Cloudflare Worker secrets — never shipped to the browser.
- **Rotate the password**: `npx wrangler secret put APP_PASSWORD` (then re-enter it in the UI).

## Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Floating Action Button**: Centered save button on mobile, regular button on desktop
- **Touch-friendly**: Large touch targets and optimized input controls
- **Adaptive UI**: Different layouts for mobile and desktop

## Cloudflare Workers Deployment
- One Worker (`finance-tracking`) serves the built SPA (`dist/` via the `ASSETS` binding, SPA fallback) plus the `/api/*` and `/img/*` routes.
- Node version: 22+ (wrangler v4; pinned in `.mise.toml`)
- Custom domain: `finance-tracking.3cxo.work` (`custom_domain` route in `wrangler.jsonc`)
- Fallback URL: `finance-tracking.ginz.workers.dev`
- Bindings: `ASSETS` (static), `IMAGES` (R2 bucket `finance-tracking-images`), `SHEET_ID` (var)
- Secrets: `GOOGLE_SERVICE_ACCOUNT`, `APP_PASSWORD`

## Deployment Commands
```bash
# Build + deploy (Node 22)
npm run deploy            # = vite build && wrangler deploy

# Set / rotate secrets
npx wrangler secret put APP_PASSWORD
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT   # paste .secrets/sa-key.json

# Service-account helpers (one-time / utility)
node scripts/verify-access.mjs                    # confirm SA can read the sheet
node scripts/add-image-column.mjs "Giao Dịch" "Ảnh"
```

# Error Handling
- Implement retry logic for failed API calls
- Show user-friendly error messages in Vietnamese
- Log errors for debugging but don't expose API details to users

# Performance Considerations
- **IndexedDB Caching**: Categories and settings stored locally for offline use
- **Batch Operations**: Multiple transactions submitted in single API call
- **Smart Input**: Debounced amount formatting and validation
- **Lazy Loading**: Components loaded on demand
- **Optimized Bundle**: Tree-shaking and code splitting for faster loading

# Data Storage
- **IndexedDB**: Browser-native storage for:
  - Dynamic categories cache
  - Shared password storage  
  - Transaction queue for batch processing (auto-save)
  - Persistent across browser sessions and refreshes
- **Offline-first**: App works without internet for cached categories
- **Auto-sync**: Categories refreshed on demand via reload button
- **Smart Recovery**: Automatically restores unsaved batch transactions on app restart

# Usage Modes
1. **Single Transaction**: Traditional form with immediate save
2. **Batch Mode**: Queue multiple transactions, submit all at once
3. **Mixed Mode**: In batch mode, can still save individual transactions immediately
4. **Auto-Recovery Mode**: App automatically enters batch mode when detecting saved transactions

# Advanced Features

## Batch Transaction Management
- **Auto-save Queue**: Every transaction added to batch is immediately saved to IndexedDB
- **Cross-session Persistence**: Queued transactions survive browser refreshes, tab closures, and app restarts
- **Smart Auto-activation**: App automatically enters batch mode if unsaved transactions are detected
- **Visual Indicators**: 
  - Red badge on batch mode button showing count of saved transactions
  - "📱 Tự động lưu" indicator in batch mode
- **Manual Controls**: "Xóa tất cả" button to clear all saved transactions

## User Experience Enhancements
- **Seamless Recovery**: No data loss on unexpected interruptions (calls, crashes, etc.)
- **Progressive Enhancement**: App works offline with cached data
- **Responsive Feedback**: Visual confirmation of all user actions
- **Smart Defaults**: Form remembers transaction type and date for faster entry

## Error Handling & Fallbacks
- **Graceful Degradation**: App loads with default categories if API fails
- **Token Validation**: Clear error messages for authentication issues
- **Retry Logic**: Automatic recovery from temporary network issues
- **Fallback Categories**: Built-in categories when remote data unavailable