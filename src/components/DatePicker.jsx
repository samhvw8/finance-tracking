import React, { useState, useEffect } from 'react'
import { formatDateForInput } from '../utils/formatters'

const DatePicker = ({ value, onChange, className = '' }) => {
  const [inputValue, setInputValue] = useState(formatDateForInput(value))
  
  // Update input value when parent value changes
  useEffect(() => {
    setInputValue(formatDateForInput(value))
  }, [value])
  
  const handleInputChange = (e) => {
    // Allow user to type freely, including leading zeros
    setInputValue(e.target.value)
  }
  
  const handleBlur = (e) => {
    const inputDate = e.target.value
    
    // Check if the input is a valid date string
    if (inputDate && !isNaN(Date.parse(inputDate))) {
      const dateValue = new Date(inputDate)
      // Only update if it's a valid date object
      if (!isNaN(dateValue.getTime())) {
        onChange(dateValue)
        setInputValue(formatDateForInput(dateValue))
        return
      }
    }
    
    // If invalid, reset to the current value
    setInputValue(formatDateForInput(value))
  }
  
  const today = new Date()
  const maxDate = formatDateForInput(today)
  
  return (
    <input
      type="date"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      max={maxDate}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  )
}

export default DatePicker