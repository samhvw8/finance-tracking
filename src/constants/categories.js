export const TRANSACTION_TYPES = {
  INCOME: 'Thu Nhập',
  EXPENSE: 'Chi Tiêu',
  INVESTMENT: 'Đầu Tư',
  WITHDRAW_INVESTMENT: 'Rút Đầu Tư'
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
  [TRANSACTION_TYPES.INVESTMENT]: [
    'Chứng Khoán',
    'Tiền Gửi',
    'Vàng',
    'Bất Động Sản',
    'Khác'
  ],
  [TRANSACTION_TYPES.WITHDRAW_INVESTMENT]: [
    'Chứng Khoán',
    'Tiền Gửi',
    'Vàng',
    'Bất Động Sản',
    'Khác'
  ]
}