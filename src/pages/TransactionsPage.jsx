import React, { useState, useEffect } from 'react'
import UnifiedTransactionForm from '../components/UnifiedTransactionForm'
import { indexedDBService } from '../services/indexedDB'

const TransactionsPage = () => {
  const [showBatchMode, setShowBatchMode] = useState(false)
  const [savedTransactionsCount, setSavedTransactionsCount] = useState(0)
  const [currentFormData, setCurrentFormData] = useState(null)

  useEffect(() => {
    checkSavedTransactions()
  }, [])

  const checkSavedTransactions = async () => {
    try {
      const savedTransactions = await indexedDBService.getQueuedTransactions()
      if (savedTransactions && savedTransactions.length > 0) {
        setSavedTransactionsCount(savedTransactions.length)
        setShowBatchMode(true)
      }
    } catch (error) {
      console.error('Error checking saved transactions:', error)
    }
  }

  return (
    <div>
      <header className="mb-6 text-center" role="banner">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Giao Dịch
        </h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Thu nhập, chi tiêu và chuyển tiền
        </p>
      </header>

      <nav className="mb-6" role="navigation" aria-label="Chế độ giao dịch">
        <button
          onClick={() => setShowBatchMode(!showBatchMode)}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 relative shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
          aria-pressed={showBatchMode}
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
      </nav>

      <main role="main" aria-label="Form giao dịch">
        <React.Suspense fallback={<div>Đang tải...</div>}>
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
  )
}

export default TransactionsPage
