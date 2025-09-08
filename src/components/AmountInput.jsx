import React, { useState, useEffect } from 'react'
import { formatCurrency, parseCurrency } from '../utils/formatters'

const AmountInput = ({ value, onChange, className = '' }) => {
  const [displayValue, setDisplayValue] = useState('')
  
  useEffect(() => {
    if (value) {
      setDisplayValue(formatCurrency(value))
    } else {
      setDisplayValue('')
    }
  }, [value])
  
  const handleChange = (e) => {
    const inputValue = e.target.value
    const numericValue = inputValue.replace(/[^\d]/g, '')
    
    if (numericValue === '') {
      setDisplayValue('')
      onChange(0)
      return
    }
    
    const amount = parseInt(numericValue)
    setDisplayValue(formatCurrency(amount))
    onChange(amount)
  }
  
  const handleFocus = (e) => {
    const numericValue = parseCurrency(displayValue)
    if (numericValue > 0) {
      setDisplayValue(numericValue.toString())
    }
  }
  
  const handleBlur = () => {
    if (displayValue && !isNaN(displayValue)) {
      // If displayValue is a plain number (from focus state)
      const amount = parseInt(displayValue)
      setDisplayValue(formatCurrency(amount))
      onChange(amount)
    } else if (displayValue) {
      // If displayValue is already formatted, keep the current parent value
      setDisplayValue(formatCurrency(value))
    }
  }
  
  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="0 ₫"
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  )
}

export default AmountInput