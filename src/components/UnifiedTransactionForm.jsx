import React, { useState, useEffect, useRef } from 'react'
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
  
  // Focus management refs
  const formRef = useRef(null)
  const submitButtonRef = useRef(null)
  const addToQueueButtonRef = useRef(null)
  
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
  
  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (mode === 'single') {
          handleSingleSubmit()
        } else if (transactions.length > 0) {
          handleBatchSubmit()
        }
      }
      
      // Ctrl/Cmd + Enter to add to queue (batch mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && mode === 'batch') {
        e.preventDefault()
        addToQueue()
      }
      
      // Escape to clear form or close batch mode
      if (e.key === 'Escape') {
        if (mode === 'batch' && onClose) {
          onClose()
        } else {
          resetForm(mode === 'batch')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mode, transactions.length, handleSingleSubmit, handleBatchSubmit, addToQueue, onClose, resetForm])

  // Message display component
  const MessageDisplay = () => message && (
    <div 
      className={`p-3 rounded-lg text-sm animate-fadeIn ${
        message.includes('thành công') || message.includes('thêm')
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center">
        {message.includes('thành công') || message.includes('thêm') ? (
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  )
  
  // Single mode render
  if (mode === 'single') {
    return (
      <form 
        ref={formRef}
        onSubmit={handleSingleSubmit} 
        className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 space-y-5 pb-24 sm:pb-8 animate-slideIn"
        aria-label="Form thêm giao dịch đơn lẻ"
        noValidate
      >
        <TransactionFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          categories={categories}
        />
        
        <MessageDisplay />
        
        {/* Desktop Save Button */}
        <button
          ref={submitButtonRef}
          type="submit"
          disabled={isSubmitting}
          className="hidden sm:block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
          aria-describedby="submit-help"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </span>
          ) : 'Lưu Giao Dịch'}
        </button>
        <div id="submit-help" className="sr-only">
          Bấm Ctrl+S để lưu nhanh
        </div>
        
        {/* Mobile Floating Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="sm:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 z-50"
          style={{ width: '64px', height: '64px' }}
          aria-label="Lưu giao dịch (Ctrl+S)"
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
      <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 animate-slideIn" aria-labelledby="queue-title">
        <div className="mb-4">
          <h2 id="queue-title" className="text-lg font-medium">Thêm nhiều giao dịch</h2>
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
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{t.name || 'Giao dịch'}</div>
                      <div className="text-xs text-gray-500">{t.displayAmount}</div>
                    </div>
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 ml-2 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:-translate-y-0.5 hover:shadow-lg"
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
      </section>
      
      {/* Form */}
      <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 space-y-5 animate-slideIn" aria-labelledby="form-title">
        <h3 id="form-title" className="sr-only">Thêm giao dịch mới</h3>
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
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            Thêm vào danh sách
          </button>
          
          <button
            type="button"
            onClick={() => handleSingleSubmit()}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default UnifiedTransactionForm