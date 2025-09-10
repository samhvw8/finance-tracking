import React, { useState, useEffect } from 'react'
import UnifiedTransactionForm from './components/UnifiedTransactionForm'
import TokenSettings from './components/TokenSettings'
import LoadingSkeleton from './components/LoadingSkeleton'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-md">
        <header className="mb-8 text-center" role="banner">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight" id="main-title">
            Theo Dõi Chi Tiêu
          </h1>
          <p className="text-gray-600 mt-3 text-sm sm:text-base" aria-describedby="main-title">
            Ghi chép giao dịch hàng ngày
          </p>
        </header>
        
        <div className="mb-6">
          <TokenSettings />
        </div>
        
        <nav className="mb-6" role="navigation" aria-label="Chế độ giao dịch">
          <button
            onClick={() => setShowBatchMode(!showBatchMode)}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 relative shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            aria-pressed={showBatchMode}
            aria-describedby="mode-description"
          >
            <span className="flex items-center justify-center">
              {showBatchMode ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M3 10h18M3 16h18" />
                  </svg>
                  Chế độ thêm đơn lẻ
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Chế độ thêm nhiều giao dịch
                </>
              )}
            </span>
            {!showBatchMode && savedTransactionsCount > 0 && (
              <span 
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center animate-bounce shadow-lg font-bold"
                role="status"
                aria-label={`${savedTransactionsCount} giao dịch chưa lưu`}
              >
                {savedTransactionsCount}
              </span>
            )}
          </button>
          <div id="mode-description" className="sr-only">
            {showBatchMode 
              ? 'Đang ở chế độ thêm nhiều giao dịch. Bạn có thể thêm nhiều giao dịch vào danh sách trước khi lưu tất cả cùng một lúc.'
              : 'Đang ở chế độ thêm đơn lẻ. Mỗi giao dịch sẽ được lưu ngay lập tức.'
            }
          </div>
        </nav>
        
        <main role="main" aria-label="Form giao dịch">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <UnifiedTransactionForm
              mode={showBatchMode ? "batch" : "single"}
              initialFormData={showBatchMode ? currentFormData : null}
              onClose={showBatchMode ? () => {
                setShowBatchMode(false)
                setSavedTransactionsCount(0)
                setCurrentFormData(null)
              } : undefined}
              onFormDataChange={!showBatchMode ? setCurrentFormData : undefined}
            />
          </React.Suspense>
        </main>
      </div>
    </div>
  )
}

export default App