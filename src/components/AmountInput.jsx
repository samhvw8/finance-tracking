import { useState, useEffect } from 'react'
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
    
    // If the input is empty or only contains whitespace/currency symbols
    if (!inputValue || inputValue.trim() === '' || inputValue === '₫') {
      setDisplayValue('')
      onChange(0)
      return
    }
    
    // Extract only numeric characters
    const numericValue = inputValue.replace(/[^\d]/g, '')
    
    if (numericValue === '') {
      setDisplayValue('')
      onChange(0)
      return
    }
    
    const amount = parseInt(numericValue)
    // Don't auto-format while typing, just store the numeric input
    setDisplayValue(numericValue)
    onChange(amount)
  }
  
  const handleFocus = () => {
    const numericValue = parseCurrency(displayValue)
    if (numericValue > 0) {
      setDisplayValue(numericValue.toString())
    }
  }
  
  const handleBlur = () => {
    if (displayValue && !isNaN(displayValue)) {
      // Format the numeric value on blur
      const amount = parseInt(displayValue)
      if (amount > 0) {
        setDisplayValue(formatCurrency(amount))
        onChange(amount)
      } else {
        setDisplayValue('')
        onChange(0)
      }
    } else if (value > 0) {
      // Fallback to the current value if display is invalid
      setDisplayValue(formatCurrency(value))
    } else {
      setDisplayValue('')
      onChange(0)
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
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder-gray-400 ${className}`}
    />
  )
}

export default AmountInput