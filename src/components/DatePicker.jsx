import { useState, useEffect } from 'react'
import { formatDateForInput } from '../utils/formatters'

const DatePicker = ({ id, value, onChange, allowFuture = false, className = '', ...props }) => {
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
  const maxDate = allowFuture ? undefined : formatDateForInput(today)

  return (
    <input
      id={id}
      type="date"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      max={maxDate}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 ${className}`}
      {...props}
    />
  )
}

export default DatePicker