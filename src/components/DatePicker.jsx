import React from 'react'
import { formatDateForInput } from '../utils/formatters'

const DatePicker = ({ value, onChange, className = '' }) => {
  const handleChange = (e) => {
    const dateValue = new Date(e.target.value)
    onChange(dateValue)
  }
  
  const today = new Date()
  const maxDate = formatDateForInput(today)
  
  return (
    <input
      type="date"
      value={formatDateForInput(value)}
      onChange={handleChange}
      max={maxDate}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  )
}

export default DatePicker