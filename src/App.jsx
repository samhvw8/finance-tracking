import React, { useState, useEffect } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { initDB } from './services/indexedDB'
import { categoriesManager } from './services/categoriesManager'
import { investmentAccountsManager } from './services/investmentAccountsManager'

function App() {
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await initDB()
      await Promise.all([
        categoriesManager.initialize(),
        investmentAccountsManager.initialize()
      ])
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

  return <RouterProvider router={router} />
}

export default App