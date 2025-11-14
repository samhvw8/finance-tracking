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

  // Ensure we have a valid Date object
  let dateObj = date
  if (!(date instanceof Date)) {
    dateObj = new Date(date)
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date() // Fallback to today
  }

  const dayIndex = dateObj.getDay()
  const dayNameVi = dayNamesVi[dayIndex]
  const formattedDate = format(dateObj, 'dd/MM/yyyy')

  return `${dayNameVi}-${formattedDate}`
}

export const formatDateForSheet = (date) => {
  // Ensure we have a valid Date object
  let dateObj = date
  if (!(date instanceof Date)) {
    dateObj = new Date(date)
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date() // Fallback to today
  }

  return format(dateObj, 'MM/dd/yyyy')
}

export const formatDateForInput = (date) => {
  // Ensure we have a valid Date object
  let dateObj = date

  if (!(date instanceof Date)) {
    dateObj = new Date(date)
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date() // Fallback to today
  }

  return format(dateObj, 'yyyy-MM-dd')
}

export const formatMonthSheet = (date) => {
  // Ensure we have a valid Date object
  let dateObj = date
  if (!(date instanceof Date)) {
    dateObj = new Date(date)
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date() // Fallback to today
  }

  return format(dateObj, 'MM/yyyy')
}