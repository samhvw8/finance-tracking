/**
 * Transaction validation utilities
 * Centralizes validation logic for investment transactions
 */

import { parseCurrencyToNumber } from '../utils/currencyFormatter'

/**
 * Validation error messages (Vietnamese)
 */
const VALIDATION_MESSAGES = {
  MISSING_ASSET_NAME: 'Vui lòng nhập tên tài sản',
  INVALID_QUANTITY: 'Vui lòng nhập số lượng hợp lệ',
  INVALID_PRICE: 'Vui lòng nhập giá hợp lệ',
  MISSING_ACCOUNT: 'Vui lòng chọn tài khoản đầu tư'
}

/**
 * Validate asset name
 * @param {string} assetName
 * @returns {string|null} Error message or null if valid
 */
const validateAssetName = (assetName) => {
  if (!assetName || !assetName.trim()) {
    return VALIDATION_MESSAGES.MISSING_ASSET_NAME
  }
  return null
}

/**
 * Validate quantity
 * @param {string|number} quantity
 * @returns {string|null} Error message or null if valid
 */
const validateQuantity = (quantity) => {
  if (!quantity) {
    return VALIDATION_MESSAGES.INVALID_QUANTITY
  }

  const numericQuantity = typeof quantity === 'string'
    ? parseFloat(quantity)
    : quantity

  if (isNaN(numericQuantity) || numericQuantity <= 0) {
    return VALIDATION_MESSAGES.INVALID_QUANTITY
  }

  return null
}

/**
 * Validate price per unit
 * @param {string} pricePerUnit - Formatted price string
 * @returns {string|null} Error message or null if valid
 */
const validatePrice = (pricePerUnit) => {
  if (!pricePerUnit) {
    return VALIDATION_MESSAGES.INVALID_PRICE
  }

  const numericPrice = parseCurrencyToNumber(pricePerUnit)

  if (numericPrice <= 0) {
    return VALIDATION_MESSAGES.INVALID_PRICE
  }

  return null
}

/**
 * Validate investment account
 * @param {string} accountId
 * @returns {string|null} Error message or null if valid
 */
const validateAccount = (accountId) => {
  if (!accountId || !accountId.trim()) {
    return VALIDATION_MESSAGES.MISSING_ACCOUNT
  }
  return null
}

/**
 * Validate complete investment transaction form data
 * @param {Object} formData - Transaction form data
 * @returns {string|null} First validation error or null if all valid
 */
export const validateInvestmentTransaction = (formData) => {
  // Validate in order of importance
  const validations = [
    validateAssetName(formData.assetName),
    validateQuantity(formData.quantity),
    validatePrice(formData.pricePerUnit)
  ]

  // Return first error found
  return validations.find(error => error !== null) || null
}

/**
 * Check if form data is valid
 * @param {Object} formData
 * @returns {boolean}
 */
export const isValidTransaction = (formData) => {
  return validateInvestmentTransaction(formData) === null
}
