import React, { useState, useEffect } from 'react'
import { TRANSACTION_TYPES } from '../constants/categories'
import { formatDateForSheet, formatCurrencyForPayload, formatMonthSheet } from '../utils/formatters'
import { createTransaction, buildTransactionPayload } from '../services/sheetdb'
import { categoriesManager } from '../services/categoriesManager'
import DatePicker from './DatePicker'
import AmountInput from './AmountInput'

const TransactionForm = ({ onFormDataChange }) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    type: TRANSACTION_TYPES.EXPENSE,
    category: '',
    name: '',
    amount: 0,
    note: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState({})
  
  useEffect(() => {
    // Subscribe to category updates
    const unsubscribe = categoriesManager.subscribe(updatedCategories => {
      setCategories(updatedCategories || {})
    })
    
    // Load initial categories
    setCategories(categoriesManager.getCategories())
    
    return unsubscribe
  }, [])
  
  const availableCategories = categories[formData.type] || []
  
  const handleInputChange = (field, value) => {
    const updatedFormData = {
      ...formData,
      [field]: value,
      ...(field === 'type' ? { category: '' } : {})
    }
    setFormData(updatedFormData)
    
    // Report form data changes to parent
    if (onFormDataChange) {
      onFormDataChange(updatedFormData)
    }
  }
  
  const validateForm = () => {
    if (!formData.type) return 'Vui lòng chọn loại giao dịch'
    if (formData.amount <= 0) return 'Vui lòng nhập số tiền hợp lệ'
    if (formData.date > new Date()) return 'Ngày không thể trong tương lai'
    return null
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setMessage(validationError)
      return
    }
    
    setIsSubmitting(true)
    setMessage('')
    
    try {
      // Debug: Check column names
      // await getSheetColumns()
      const payload = buildTransactionPayload({
        date: formatDateForSheet(formData.date),
        type: formData.type,
        category: formData.category || 'Khác',
        name: formData.name || '',
        amount: formatCurrencyForPayload(formData.amount),
        note: formData.note,
        month: formatMonthSheet(formData.date)
      })
      
      await createTransaction(payload)
      
      setMessage('Giao dịch đã được lưu thành công!')
      setFormData({
        date: new Date(),
        type: TRANSACTION_TYPES.EXPENSE,
        category: '',
        name: '',
        amount: 0,
        note: ''
      })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4 pb-20 sm:pb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày
        </label>
        <DatePicker
          value={formData.date}
          onChange={(date) => handleInputChange('date', date)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại Giao Dịch
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.values(TRANSACTION_TYPES).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danh Mục
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Chọn danh mục</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên Giao Dịch
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Nhập mô tả giao dịch"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số Tiền
        </label>
        <AmountInput
          value={formData.amount}
          onChange={(amount) => handleInputChange('amount', amount)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ghi Chú
        </label>
        <textarea
          value={formData.note}
          onChange={(e) => handleInputChange('note', e.target.value)}
          placeholder="Ghi chú thêm (không bắt buộc)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('thành công') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      {/* Desktop Save Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="hidden sm:block w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}
      </button>
      
      {/* Mobile Floating Save Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="sm:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 z-50"
        style={{ width: '56px', height: '56px' }}
      >
        {isSubmitting ? (
          <svg className="animate-spin h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </form>
  )
}

export default TransactionForm