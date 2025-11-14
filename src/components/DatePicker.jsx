import { useState, useEffect } from 'react'
import { formatDateForInput } from '../utils/formatters'

const DatePicker = ({ id, label, value, onChange, allowFuture = false, className = '', required = false, ...props }) => {
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
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type="date"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        max={maxDate}
        required={required}
        className={`w-full px-3 py-2.5 text-sm border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 ${className}`}
        {...props}
      />
    </div>
  )
}

export default DatePicker