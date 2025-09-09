import { format } from 'date-fns'

export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return ''
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount) + ' ₫'
}

export const formatCurrencyForPayload = (amount) => {
  if (!amount || isNaN(amount)) return ''
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount
  return numAmount.toString()
}

export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0
  return parseFloat(currencyString.replace(/[,₫\s]/g, ''))
}

export const formatDateForDisplay = (date) => {
  const dayNamesVi = ['Chủ', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy']
  
  const dayIndex = date.getDay()
  const dayNameVi = dayNamesVi[dayIndex]
  const formattedDate = format(date, 'dd/MM/yyyy')
  
  return `${dayNameVi}-${formattedDate}`
}

export const formatDateForSheet = (date) => {
  return format(date, 'MM/dd/yyyy')
}

export const formatDateForInput = (date) => {
  return format(date, 'yyyy-MM-dd')
}

export const formatMonthSheet = (date) => {
  return format(date, 'MM/yyyy')
}