import React, { useState, useEffect } from 'react'
import { categoriesManager } from '../services/categoriesManager'
import { indexedDBService } from '../services/indexedDB'

const TokenSettings = () => {
  const [token, setToken] = useState('')
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [isEditingToken, setIsEditingToken] = useState(false)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    loadToken()
  }, [])
  
  const loadToken = async () => {
    const savedToken = await indexedDBService.getSetting('apiToken')
    if (savedToken) {
      setToken(savedToken)
    }
  }
  
  const handleSaveToken = async () => {
    if (!token.trim()) {
      showMessage('Vui lòng nhập token!', 'error')
      return
    }
    
    try {
      await indexedDBService.saveSetting('apiToken', token.trim())
      setIsEditingToken(false)
      showMessage('Token đã được lưu!', 'success')
    } catch (error) {
      console.error('Error saving token:', error)
      showMessage('Lỗi khi lưu token!', 'error')
    }
  }
  
  const handleReloadCategories = async () => {
    setIsLoadingCategories(true)
    
    try {
      await categoriesManager.loadFromAPI()
      showMessage('Danh mục đã được cập nhật!', 'success')
    } catch (error) {
      console.error('Error reloading categories:', error)
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        showMessage('Token không hợp lệ. Vui lòng kiểm tra lại!', 'error')
      } else {
        showMessage('Lỗi khi tải danh mục. Vui lòng thử lại!', 'error')
      }
    } finally {
      setIsLoadingCategories(false)
    }
  }
  
  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 mb-4 animate-scaleIn">
      <div className="space-y-4">
        {/* Token Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">API Token</h3>
            {!isEditingToken && (
              <button
                onClick={() => setIsEditingToken(true)}
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors hover:bg-blue-50 px-2 py-1 rounded-lg"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
          
          {isEditingToken ? (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Nhập SheetDB Bearer Token"
                  className="w-full px-4 py-2.5 pr-20 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-600 transition-colors px-2 py-1 hover:bg-blue-50 rounded-lg"
                >
                  {showToken ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToken}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setIsEditingToken(false)
                    loadToken()
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 text-sm rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {token ? '••••••••••••••••' : 'Chưa cài đặt'}
            </div>
          )}
        </div>
        
        {/* Refresh Categories */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-700">Cập nhật danh mục</span>
          <button
            onClick={handleReloadCategories}
            disabled={isLoadingCategories}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 text-sm rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
          >
            {isLoadingCategories ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </span>
            ) : (
              'Tải lại'
            )}
          </button>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-xl text-sm text-center animate-fadeIn ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenSettings