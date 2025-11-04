export const TRANSACTION_TYPES = {
  INCOME: 'Thu Nhập',
  EXPENSE: 'Chi Tiêu',
  TRANSFER_TO_INVESTMENT: 'Chuyển Tiền Vào Tài Khoản',
  WITHDRAW_FROM_INVESTMENT: 'Rút Tiền Ra Tài Khoản'
}

export const CATEGORIES = {
  [TRANSACTION_TYPES.INCOME]: [
    'Lương',
    'Thưởng',
    'Bán Hàng',
    'Đầu Tư',
    'Khác'
  ],
  [TRANSACTION_TYPES.EXPENSE]: [
    'Ăn Uống',
    'Mua Sắm',
    'Di Chuyển',
    'Giải Trí',
    'Y Tế',
    'Học Tập',
    'Hóa Đơn',
    'Khác'
  ],
  [TRANSACTION_TYPES.TRANSFER_TO_INVESTMENT]: [
    'Cổ phiếu Blue chip',
    'Cổ phiếu Việt Nam',
    'Tiết kiệm Ngân Hàng',
    'Vàng'
  ],
  [TRANSACTION_TYPES.WITHDRAW_FROM_INVESTMENT]: [
    'Cổ phiếu Blue chip',
    'Cổ phiếu Việt Nam',
    'Tiết kiệm Ngân Hàng',
    'Vàng'
  ]
}

// Investment transaction types
export const INVESTMENT_TYPES = {
  BUY: 'Buy',
  SELL: 'Sell'
}

// Investment asset types
export const ASSET_TYPES = {
  STOCKS: 'Stocks',
  CRYPTO: 'Crypto',
  FOREX: 'Forex',
  BONDS: 'Bonds',
  OTHER: 'Other'
}