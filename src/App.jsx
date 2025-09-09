import React, { useState, useEffect } from 'react'
import TransactionForm from './components/TransactionForm'
import BatchTransactionForm from './components/BatchTransactionForm'
import TokenSettings from './components/TokenSettings'
import { initDB, indexedDBService } from './services/indexedDB'
import { categoriesManager } from './services/categoriesManager'

function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [showBatchMode, setShowBatchMode] = useState(false)
  const [savedTransactionsCount, setSavedTransactionsCount] = useState(0)
  const [currentFormData, setCurrentFormData] = useState(null)
  
  useEffect(() => {
    initializeApp()
  }, [])
  
  const initializeApp = async () => {
    try {
      await initDB()
      await categoriesManager.initialize()
      
      // Check if there are saved batch transactions
      const savedTransactions = await indexedDBService.getQueuedTransactions()
      if (savedTransactions && savedTransactions.length > 0) {
        setSavedTransactionsCount(savedTransactions.length)
        setShowBatchMode(true) // Auto-activate batch mode
      }
    } catch (error) {
      console.error('Error initializing app:', error)
    } finally {
      setIsInitializing(false)
    }
  }
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang khởi tạo...</p>
          <p className="mt-2 text-xs text-gray-500">Kiểm tra dữ liệu đã lưu</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Theo Dõi Chi Tiêu
          </h1>
          <p className="text-gray-600 mt-2">
            Ghi chép giao dịch hàng ngày
          </p>
        </header>
        
        <TokenSettings />
        
        {showBatchMode ? (
          <BatchTransactionForm 
            initialFormData={currentFormData}
            onClose={() => {
              setShowBatchMode(false)
              setSavedTransactionsCount(0) // Reset count when closing batch mode
              setCurrentFormData(null) // Clear form data
            }} 
          />
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowBatchMode(true)
                }}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors relative"
              >
                <span>Chế độ thêm nhiều giao dịch</span>
                {savedTransactionsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {savedTransactionsCount}
                  </span>
                )}
              </button>
            </div>
            <TransactionForm onFormDataChange={setCurrentFormData} />
          </>
        )}
      </div>
    </div>
  )
}

export default App