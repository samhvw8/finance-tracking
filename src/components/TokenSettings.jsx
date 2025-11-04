import React, { useState, useEffect } from 'react'
import { categoriesManager } from '../services/categoriesManager'
import { investmentAccountsManager } from '../services/investmentAccountsManager'
import { indexedDBService } from '../services/indexedDB'

const TokenSettings = () => {
  const [token, setToken] = useState('')
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
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

  const handleReloadAccounts = async () => {
    setIsLoadingAccounts(true)

    try {
      await investmentAccountsManager.refresh()
      showMessage('Danh sách tài khoản đã được cập nhật!', 'success')
    } catch (error) {
      console.error('Error reloading accounts:', error)
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        showMessage('Token không hợp lệ. Vui lòng kiểm tra lại!', 'error')
      } else {
        showMessage('Lỗi khi tải danh sách tài khoản. Vui lòng thử lại!', 'error')
      }
    } finally {
      setIsLoadingAccounts(false)
    }
  }
  
  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }
  
  return (
    <div className="space-y-3">
      {/* Token Section */}
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">API Token</h3>
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
            <div className="text-xs text-gray-500">
              {token ? '••••••••••••••••' : 'Chưa cài đặt'}
            </div>
          )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Thao Tác</h3>

        {/* Google Sheets Link */}
        <a
          href="https://docs.google.com/spreadsheets/d/1mmENKogRPN-tNqPET8NUJsEpFR_zoldxfTpkLl43-tY/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-50 text-blue-700 py-2 px-3 text-xs rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center justify-center font-medium border border-blue-200"
          aria-label="Mở Google Sheets để xem dữ liệu giao dịch"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
          </svg>
          Xem Google Sheets
        </a>

        {/* Refresh Categories */}
        <button
          onClick={handleReloadCategories}
          disabled={isLoadingCategories}
          className="w-full bg-green-50 text-green-700 py-2 px-3 text-xs rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium border border-green-200"
        >
          {isLoadingCategories ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tải Lại Danh Mục
            </>
          )}
        </button>

        {/* Refresh Investment Accounts */}
        <button
          onClick={handleReloadAccounts}
          disabled={isLoadingAccounts}
          className="w-full bg-purple-50 text-purple-700 py-2 px-3 text-xs rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium border border-purple-200"
        >
          {isLoadingAccounts ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tải Lại Tài Khoản
            </>
          )}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-2 rounded-lg text-xs text-center animate-fadeIn ${
          message.type === 'error'
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

export default TokenSettings