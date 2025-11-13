# Project Overview

This is a comprehensive finance tracking web application that allows users to manage both regular transactions and detailed investment transactions via Google Sheets and the SheetDB API. The app features:

- **Main Transactions**: Income, expenses, and account transfers with single and batch modes
- **Investment Tracking**: Detailed buy/sell transactions with asset tracking, fees, and P&L
- **Linked Transactions**: Automatically create cash flow transactions when recording investments
- **Dynamic Categories**: Categories loaded from Google Sheets for flexibility
- **Offline-First**: IndexedDB caching for offline use and smart recovery
- **Secure Token Management**: API token configurable via UI or environment
- **Mobile-Optimized**: Responsive design for both mobile and desktop devices
- **Cloudflare Pages Deployment**: Fast, globally distributed hosting

# API Integration

## SheetDB Endpoint
- Base URL: `https://sheetdb.io/api/v1/otpxy27h47ofu`
- Method: POST for creating new transactions (single or batch)
- Method: GET for fetching categories from setup sheet
- Sheet name: "Giao Dịch" (for transactions)
- Setup sheet: "Setup Finanace" (for dynamic categories)
- Authentication: Bearer token (configurable via UI or environment variable)

## Transaction Data Structure

The Google Sheet "Giao Dịch" has the following columns:
- **Date**: Transaction date (format: MM/dd/yyyy for sheet, display as "Day-dd/MM/yyyy")
- **Type**: Transaction type (Thu Nhập | Chi Tiêu | Chuyển Tiền Vào Tài Khoản | Rút Tiền Ra Tài Khoản)
- **Category**: Category based on type (loaded dynamically from Setup sheet)
- **Tên**: Transaction name/description
- **Số Tiền**: Amount (numbers without currency symbol for sheet, display with VND)
- **Note**: Optional notes

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
fetch('https://sheetdb.io/api/v1/otpxy27h47ofu', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        data: [{
            'Date': 'Thu-17/04/2025',
            'Type': 'Chi Tiêu',
            'Category': 'Mua Sắm',
            'Tên': 'Tiền Ảnh',
            'Số Tiền': '2,127,000 ₫',
            'Note': ''
        }],
        sheet: 'Giao Dịch'
    })
})
```

# Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

# Project Structure

```
finance-tracking/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── UnifiedTransactionForm.jsx    # Unified form for single/batch transactions
│   │   ├── TransactionFormFields.jsx     # Shared form fields component
│   │   ├── InvestmentTransactionForm.jsx # Investment transaction form (Buy/Sell)
│   │   ├── TokenSettings.jsx             # API token and category refresh UI
│   │   ├── DatePicker.jsx                # Date input component
│   │   ├── AmountInput.jsx               # Currency input with formatting
│   │   └── Sidebar.jsx                   # Navigation sidebar
│   ├── services/             # API integration and data management
│   │   ├── sheetdb.js                    # SheetDB API client with linked transaction support
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
├── public/                   # Static assets
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

## Token Security
- **UI Configuration**: Token can be set via settings interface (masked input)
- **IndexedDB Storage**: Securely stored in browser's IndexedDB
- **Environment Fallback**: Falls back to `VITE_SHEETDB_TOKEN` environment variable
- **Dynamic Loading**: All API calls use dynamically retrieved token

## Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Floating Action Button**: Centered save button on mobile, regular button on desktop
- **Touch-friendly**: Large touch targets and optimized input controls
- **Adaptive UI**: Different layouts for mobile and desktop

## Cloudflare Pages Deployment
- Build output directory: `dist`
- Framework preset: React/Vite
- Node version: 18 or higher
- Project name: `finance-tracking`
- Primary domain: `finance-tracking-bo5.pages.dev`
- Custom domain: `finance-tracking.samtrang.com` (configured via DNS CNAME)
- Required environment variables:
  - `CLOUDFLARE_API_TOKEN` (for deployment)
  - `VITE_SHEETDB_TOKEN` (optional, can be set via UI)

## Deployment Commands
```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Manual deployment via wrangler
npx wrangler pages deploy dist --project-name=finance-tracking
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
  - API token storage  
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