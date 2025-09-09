import React, { useState, useEffect } from 'react'
import { formatDateForSheet, formatCurrencyForPayload, formatCurrency, formatMonthSheet } from '../utils/formatters'
import { createTransaction, createBatchTransactions, buildTransactionPayload } from '../services/sheetdb'
import { indexedDBService } from '../services/indexedDB'
import { useTransactionForm } from '../hooks/useTransactionForm'
import TransactionFormFields from './TransactionFormFields'

const UnifiedTransactionForm = ({ 
  mode = 'single', // 'single' or 'batch'
  onClose,
  initialFormData,
  onFormDataChange
}) => {
  const {
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    message,
    categories,
    handleInputChange,
    validateForm,
    resetForm,
    showMessage
  } = useTransactionForm(initialFormData, mode === 'single' ? onFormDataChange : null)
  
  // Batch mode specific state
  const [transactions, setTransactions] = useState([])
  
  // Update form when initialFormData changes (for batch mode)
  useEffect(() => {
    if (initialFormData && mode === 'batch') {
      setFormData(initialFormData)
    }
  }, [initialFormData, mode, setFormData])
  
  // Load saved transactions from IndexedDB on batch mode mount
  useEffect(() => {
    if (mode === 'batch') {
      loadSavedTransactions()
    }
  }, [mode])
  
  // Auto-save transactions to IndexedDB whenever transactions array changes (batch mode)
  useEffect(() => {
    if (mode === 'batch' && transactions.length >= 0) {
      saveTransactionsToStorage()
    }
  }, [transactions, mode])
  
  const loadSavedTransactions = async () => {
    try {
      const savedTransactions = await indexedDBService.getQueuedTransactions()
      if (savedTransactions && savedTransactions.length > 0) {
        const restoredTransactions = savedTransactions.map(t => ({
          ...t,
          date: new Date(t.date),
          displayAmount: formatCurrency(t.amount)
        }))
        setTransactions(restoredTransactions)
        showMessage(`Đã khôi phục ${savedTransactions.length} giao dịch chưa lưu!`)
      }
    } catch (error) {
      console.error('Error loading saved transactions:', error)
    }
  }
  
  const saveTransactionsToStorage = async () => {
    try {
      await indexedDBService.clearAllQueue()
      
      for (const transaction of transactions) {
        await indexedDBService.addToQueue({
          ...transaction,
          date: transaction.date.toISOString()
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
  
  const buildPayload = (data) => {
    return buildTransactionPayload({
      date: formatDateForSheet(data.date),
      type: data.type,
      category: data.category || 'Khác',
      name: data.name || '',
      amount: formatCurrencyForPayload(data.amount),
      note: data.note,
      month: formatMonthSheet(data.date)
    })
  }
  
  // Single mode submit
  const handleSingleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      showMessage(validationError)
      return
    }
    
    setIsSubmitting(true)
    showMessage('')
    
    try {
      const payload = buildPayload(formData)
      await createTransaction(payload)
      
      showMessage('Giao dịch đã được lưu thành công!')
      resetForm(mode === 'batch') // Keep date/type in batch mode
    } catch (error) {
      showMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Batch mode - add to queue
  const addToQueue = () => {
    const validationError = validateForm()
    if (validationError) {
      showMessage(validationError)
      return
    }
    
    const newTransaction = {
      ...formData,
      id: Date.now(),
      displayAmount: formatCurrency(formData.amount)
    }
    
    setTransactions([...transactions, newTransaction])
    resetForm(true) // Keep date and type
    showMessage('Đã thêm vào danh sách!', 2000)
  }
  
  const removeTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }
  
  // Batch mode submit
  const handleBatchSubmit = async () => {
    if (transactions.length === 0) {
      showMessage('Không có giao dịch nào để lưu!')
      return
    }
    
    setIsSubmitting(true)
    showMessage('')
    
    try {
      const payload = transactions.map(t => buildPayload(t))
      await createBatchTransactions(payload)
      
      showMessage(`${transactions.length} giao dịch đã được lưu thành công!`)
      setTransactions([])
      await clearSavedTransactions()
      setTimeout(() => onClose && onClose(), 1500)
    } catch (error) {
      showMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Message display component
  const MessageDisplay = () => message && (
    <div className={`p-3 rounded-lg text-sm ${
      message.includes('thành công') || message.includes('thêm')
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {message}
    </div>
  )
  
  // Single mode render
  if (mode === 'single') {
    return (
      <form onSubmit={handleSingleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4 pb-20 sm:pb-6">
        <TransactionFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          categories={categories}
        />
        
        <MessageDisplay />
        
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
  
  // Batch mode render
  return (
    <div className="space-y-4 mb-4">
      {/* Transaction Queue */}
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
                    showMessage('Đã xóa tất cả!', 2000)
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
                      <div className="font-medium text-sm">{t.name || 'Giao dịch'}</div>
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
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <TransactionFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          categories={categories}
        />
        
        <MessageDisplay />
        
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
            onClick={() => handleSingleSubmit()}
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

export default UnifiedTransactionForm