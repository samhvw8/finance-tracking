/**
 * Custom hook for investment transaction form state management
 * Encapsulates form logic and reduces component complexity
 */

import { useState, useEffect, useCallback } from 'react'
import { INVESTMENT_TYPES } from '../constants/categories'
import { formatCurrencyInput, calculateTotal, cleanCurrencyValue } from '../utils/currencyFormatter'
import { validateInvestmentTransaction } from '../validators/transactionValidator'

const createInitialFormData = (defaultAccount = null) => ({
  date: new Date(),
  investmentAccount: defaultAccount?.id || '',
  investmentAccountName: defaultAccount?.name || '',
  type: INVESTMENT_TYPES.BUY,
  assetName: '',
  quantity: '',
  pricePerUnit: '',
  totalAmount: '',
  fees: '0',
  realizedPL: '',
  notes: ''
})

/**
 * Hook for managing investment form state and interactions
 * @param {Array} accounts - Available investment accounts
 * @returns {Object} Form state and handlers
 */
export const useInvestmentForm = (accounts = []) => {
  const defaultAccount = accounts.length > 0 ? accounts[0] : null
  const [formData, setFormData] = useState(createInitialFormData(defaultAccount))

  // Update default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !formData.investmentAccount) {
      setFormData(prev => ({
        ...prev,
        investmentAccount: accounts[0].id,
        investmentAccountName: accounts[0].name
      }))
    }
  }, [accounts, formData.investmentAccount])

  // Auto-calculate total amount
  useEffect(() => {
    if (formData.quantity && formData.pricePerUnit) {
      const total = calculateTotal(formData.quantity, formData.pricePerUnit)
      setFormData(prev => ({ ...prev, totalAmount: total }))
    }
  }, [formData.quantity, formData.pricePerUnit])

  /**
   * Handle text input changes
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  /**
   * Handle numeric input (quantity, decimals allowed)
   */
  const handleNumberInput = useCallback((e) => {
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d.]/g, '')
    setFormData(prev => ({ ...prev, [name]: numericValue }))
  }, [])

  /**
   * Handle currency input (formatted with thousand separators)
   */
  const handleCurrencyInput = useCallback((e) => {
    const { name, value } = e.target
    const formatted = formatCurrencyInput(value)
    setFormData(prev => ({ ...prev, [name]: formatted }))
  }, [])

  /**
   * Handle investment account selection
   */
  const handleAccountChange = useCallback((accountId) => {
    const selectedAccount = accounts.find(acc => acc.id === accountId)
    setFormData(prev => ({
      ...prev,
      investmentAccount: accountId,
      investmentAccountName: selectedAccount?.name || accountId
    }))
  }, [accounts])

  /**
   * Validate current form data
   * @returns {string|null} Error message or null if valid
   */
  const validate = useCallback(() => {
    return validateInvestmentTransaction(formData)
  }, [formData])

  /**
   * Reset form to initial state
   * @param {boolean} keepDateAndType - Preserve date and type for batch mode
   */
  const resetForm = useCallback((keepDateAndType = false) => {
    if (keepDateAndType) {
      setFormData(prev => ({
        ...prev,
        assetName: '',
        quantity: '',
        pricePerUnit: '',
        totalAmount: '',
        fees: '0',
        realizedPL: '',
        notes: ''
      }))
    } else {
      const defaultAccount = accounts.length > 0
        ? accounts[0]
        : { id: 'INV001', name: 'Cổ phiếu Việt Nam' }
      setFormData(createInitialFormData(defaultAccount))
    }
  }, [accounts])

  /**
   * Get payload data for API submission (clean formatted values)
   */
  const getPayloadData = useCallback(() => {
    return {
      ...formData,
      pricePerUnit: cleanCurrencyValue(formData.pricePerUnit),
      totalAmount: cleanCurrencyValue(formData.totalAmount),
      fees: cleanCurrencyValue(formData.fees) || '0',
      realizedPL: cleanCurrencyValue(formData.realizedPL) || ''
    }
  }, [formData])

  return {
    formData,
    setFormData,
    handlers: {
      handleInputChange,
      handleNumberInput,
      handleCurrencyInput,
      handleAccountChange
    },
    validate,
    resetForm,
    getPayloadData
  }
}
