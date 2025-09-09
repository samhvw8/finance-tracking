import React, { useState, useEffect } from 'react'
import { TRANSACTION_TYPES } from '../constants/categories'
import { formatDateForSheet, formatCurrencyForPayload, formatCurrency, formatMonthSheet } from '../utils/formatters'
import { createTransaction, createBatchTransactions, buildTransactionPayload } from '../services/sheetdb'
import { categoriesManager } from '../services/categoriesManager'
import { indexedDBService } from '../services/indexedDB'
import DatePicker from './DatePicker'
import AmountInput from './AmountInput'

const BatchTransactionForm = ({ onClose }) => {
  const [transactions, setTransactions] = useState([])
  const [currentForm, setCurrentForm] = useState({
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
    const unsubscribe = categoriesManager.subscribe(updatedCategories => {
      setCategories(updatedCategories || {})
    })
    
    setCategories(categoriesManager.getCategories())
    
    // Load saved transactions from IndexedDB on component mount
    loadSavedTransactions()
    
    return unsubscribe
  }, [])
  
  // Auto-save transactions to IndexedDB whenever transactions array changes
  useEffect(() => {
    saveTransactionsToStorage()
  }, [transactions])
  
  const loadSavedTransactions = async () => {
    try {
      const savedTransactions = await indexedDBService.getQueuedTransactions()
      if (savedTransactions && savedTransactions.length > 0) {
        // Convert saved transactions back to proper format
        const restoredTransactions = savedTransactions.map(t => ({
          ...t,
          date: new Date(t.date), // Convert string back to Date object
          displayAmount: formatCurrency(t.amount)
        }))
        setTransactions(restoredTransactions)
        setMessage(`Đã khôi phục ${savedTransactions.length} giao dịch chưa lưu!`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error loading saved transactions:', error)
    }
  }
  
  const saveTransactionsToStorage = async () => {
    try {
      // Clear existing queue
      await indexedDBService.clearAllQueue()
      
      // Save current transactions
      for (const transaction of transactions) {
        await indexedDBService.addToQueue({
          ...transaction,
          date: transaction.date.toISOString() // Convert Date to string for storage
        })
      }
    } catch (error) {
      console.error('Error saving transactions to storage:', error)
    }
  }
  
  const clearSavedTransactions = async () => {
    try {
      await indexedDBService.clearAllQueue()
    } catch (error) {
      console.error('Error clearing saved transactions:', error)
    }
  }
  
  const availableCategories = categories[currentForm.type] || []
  
  const handleInputChange = (field, value) => {
    setCurrentForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { category: '' } : {})
    }))
  }
  
  const validateForm = () => {
    if (!currentForm.type) return 'Vui lòng chọn loại giao dịch'
    if (currentForm.amount <= 0) return 'Vui lòng nhập số tiền hợp lệ'
    if (currentForm.date > new Date()) return 'Ngày không thể trong tương lai'
    return null
  }
  
  const addToQueue = () => {
    const validationError = validateForm()
    if (validationError) {
      setMessage(validationError)
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    const newTransaction = {
      ...currentForm,
      id: Date.now(),
      displayAmount: formatCurrency(currentForm.amount)
    }
    
    setTransactions([...transactions, newTransaction])
    
    // Reset form but keep date and type
    setCurrentForm({
      date: currentForm.date,
      type: currentForm.type,
      category: '',
      name: '',
      amount: 0,
      note: ''
    })
    
    setMessage('Đã thêm vào danh sách!')
    setTimeout(() => setMessage(''), 2000)
  }
  
  const removeTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id)
    setTransactions(updatedTransactions)
  }
  
  const handleBatchSubmit = async () => {
    if (transactions.length === 0) {
      setMessage('Không có giao dịch nào để lưu!')
      return
    }
    
    setIsSubmitting(true)
    setMessage('')
    
    try {
      const payload = transactions.map(t => buildTransactionPayload({
        date: formatDateForSheet(t.date),
        type: t.type,
        category: t.category || 'Khác',
        name: t.name || '',
        amount: formatCurrencyForPayload(t.amount),
        note: t.note,
        month: formatMonthSheet(t.date)
      }))
      
      await createBatchTransactions(payload)
      
      setMessage(`${transactions.length} giao dịch đã được lưu thành công!`)
      setTransactions([])
      await clearSavedTransactions() // Clear saved data after successful submission
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSingleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setMessage(validationError)
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    setIsSubmitting(true)
    setMessage('')
    
    try {
      const payload = buildTransactionPayload({
        date: formatDateForSheet(currentForm.date),
        type: currentForm.type,
        category: currentForm.category || 'Khác',
        name: currentForm.name || '',
        amount: formatCurrencyForPayload(currentForm.amount),
        note: currentForm.note,
        month: formatMonthSheet(currentForm.date)
      })
      
      await createTransaction(payload)
      
      setMessage('Giao dịch đã được lưu thành công!')
      
      // Reset form
      setCurrentForm({
        date: currentForm.date,
        type: currentForm.type,
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
    <div className="space-y-4 mb-4">
      {/* Transaction Queue - Always visible in batch mode */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Thêm nhiều giao dịch</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-600">
              Danh sách chờ ({transactions.length})
            </div>
            {transactions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600">📱 Tự động lưu</span>
                <button
                  onClick={() => {
                    setTransactions([])
                    clearSavedTransactions()
                    setMessage('Đã xóa tất cả!')
                    setTimeout(() => setMessage(''), 2000)
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
          
          {transactions.length > 0 ? (
            <>
              <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                {transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.displayAmount}</div>
                    </div>
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="text-red-500 hover:text-red-700 text-xl ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? `Đang lưu...` : `Lưu tất cả (${transactions.length})`}
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Chưa có giao dịch nào
            </div>
          )}
        </div>
      </div>
      
      {/* Form - Always visible below queue */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        
        {/* Form Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
          <DatePicker
            value={currentForm.date}
            onChange={(date) => handleInputChange('date', date)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Loại Giao Dịch</label>
          <select
            value={currentForm.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.values(TRANSACTION_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Danh Mục</label>
          <select
            value={currentForm.category}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên Giao Dịch</label>
          <input
            type="text"
            value={currentForm.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Nhập mô tả giao dịch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số Tiền</label>
          <AmountInput
            value={currentForm.amount}
            onChange={(amount) => handleInputChange('amount', amount)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi Chú</label>
          <textarea
            value={currentForm.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder="Ghi chú thêm (không bắt buộc)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('thành công') || message.includes('thêm')
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={addToQueue}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Thêm vào danh sách
          </button>
          
          <button
            type="button"
            onClick={handleSingleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchTransactionForm