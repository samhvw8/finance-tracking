/**
 * Currency formatting utilities for Vietnamese Dong (VND)
 * Eliminates duplication and centralizes formatting logic
 */

const VI_VN_FORMAT_OPTIONS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}

/**
 * Remove formatting from currency string (dots/commas)
 * @param {string} formattedValue - Formatted currency string
 * @returns {string} Clean numeric string
 */
export const cleanCurrencyValue = (formattedValue) => {
  if (!formattedValue) return ''
  return String(formattedValue).replace(/\./g, '')
}

/**
 * Format number as Vietnamese currency (without symbol)
 * @param {number|string} value - Numeric value
 * @returns {string} Formatted string with thousand separators
 */
export const formatCurrency = (value) => {
  if (!value || value === '') return ''

  const numericValue = typeof value === 'string'
    ? parseFloat(cleanCurrencyValue(value))
    : value

  if (isNaN(numericValue)) return ''

  return new Intl.NumberFormat('vi-VN', VI_VN_FORMAT_OPTIONS).format(numericValue)
}

/**
 * Parse and format currency input (handles user typing)
 * @param {string} input - User input string
 * @returns {string} Formatted currency string or empty string
 */
export const formatCurrencyInput = (input) => {
  const numericValue = input.replace(/[^\d]/g, '')

  if (!numericValue) return ''

  const number = parseFloat(numericValue)
  return formatCurrency(number)
}

/**
 * Parse currency string to numeric value for calculations
 * @param {string} formattedValue - Formatted currency string
 * @returns {number} Numeric value
 */
export const parseCurrencyToNumber = (formattedValue) => {
  const cleaned = cleanCurrencyValue(formattedValue)
  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

/**
 * Calculate total from quantity and price
 * @param {string|number} quantity
 * @param {string} pricePerUnit - Formatted price string
 * @returns {string} Formatted total amount
 */
export const calculateTotal = (quantity, pricePerUnit) => {
  if (!quantity || !pricePerUnit) return ''

  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity
  const price = parseCurrencyToNumber(pricePerUnit)

  if (isNaN(qty) || isNaN(price)) return ''

  const total = qty * price
  return formatCurrency(total)
}
