import React, { useState, useEffect, useRef } from 'react'
import { formatDateForSheet } from '../utils/formatters'
import { createInvestmentTransaction, createBatchInvestmentTransactions, buildInvestmentTransactionPayload } from '../services/sheetdb'
import { indexedDBService } from '../services/indexedDB'
import { investmentAccountsManager } from '../services/investmentAccountsManager'
import { INVESTMENT_TYPES } from '../constants/categories'
import DatePicker from './DatePicker'

const InvestmentTransactionForm = ({
  mode = 'single', // 'single' or 'batch'
  onClose
}) => {
  const [accounts, setAccounts] = useState([])
  const [formData, setFormData] = useState({
    date: new Date(),
    investmentAccount: '',
    type: INVESTMENT_TYPES.BUY,
    assetName: '',
    quantity: '',
    pricePerUnit: '',
    totalAmount: '',
    fees: '0',
    realizedPL: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [transactions, setTransactions] = useState([])

  const formRef = useRef(null)

  // Load investment accounts
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = () => {
    const loadedAccounts = investmentAccountsManager.getAccounts()
    setAccounts(loadedAccounts)
    if (loadedAccounts.length > 0 && !formData.investmentAccount) {
      setFormData(prev => ({
        ...prev,
        investmentAccount: loadedAccounts[0].id
      }))
    }
  }

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

  // Auto-calculate total amount when quantity or price per unit changes
  useEffect(() => {
    if (formData.quantity && formData.pricePerUnit) {
      const quantity = parseFloat(formData.quantity)
      const price = parseFloat(formData.pricePerUnit.replace(/,/g, ''))
      if (!isNaN(quantity) && !isNaN(price)) {
        const total = quantity * price
        setFormData(prev => ({
          ...prev,
          totalAmount: total.toLocaleString('vi-VN')
        }))
      }
    }
  }, [formData.quantity, formData.pricePerUnit])

  const loadSavedTransactions = async () => {
    try {
      const savedTransactions = await indexedDBService.getQueuedInvestmentTransactions()
      if (savedTransactions && savedTransactions.length > 0) {
        const restoredTransactions = savedTransactions.map(t => ({
          ...t,
          date: new Date(t.date)
        }))
        setTransactions(restoredTransactions)
        showMessage(`Đã khôi phục ${savedTransactions.length} giao dịch đầu tư chưa lưu!`)
      }
    } catch (error) {
      console.error('Error loading saved transactions:', error)
    }
  }

  const saveTransactionsToStorage = async () => {
    try {
      await indexedDBService.clearInvestmentQueue()

      for (const transaction of transactions) {
        await indexedDBService.addToInvestmentQueue({
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
      await indexedDBService.clearInvestmentQueue()
    } catch (error) {
      console.error('Error clearing saved transactions:', error)
    }
  }

  const showMessage = (msg, timeout = 5000) => {
    setMessage(msg)
    if (timeout) {
      setTimeout(() => setMessage(''), timeout)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberInput = (e) => {
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d.]/g, '')
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }))
  }

  const handleCurrencyInput = (e) => {
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d]/g, '')
    if (numericValue) {
      const formatted = parseFloat(numericValue).toLocaleString('vi-VN')
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    if (!formData.assetName.trim()) {
      return 'Vui lòng nhập tên tài sản'
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      return 'Vui lòng nhập số lượng hợp lệ'
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit.replace(/,/g, '')) <= 0) {
      return 'Vui lòng nhập giá hợp lệ'
    }
    return null
  }

  const resetForm = (keepDateAndType = false) => {
    if (keepDateAndType) {
      setFormData(prev => ({
        ...prev,
        assetName: '',
        quantity: '',
        pricePerUnit: '',
        totalAmount: '',
        fees: '0',
        realizedPL: '',
        notes: ''
      }))
    } else {
      setFormData({
        date: new Date(),
        investmentAccount: 'INV001',
        type: INVESTMENT_TYPES.BUY,
        assetType: ASSET_TYPES.STOCKS,
        assetName: '',
        quantity: '',
        pricePerUnit: '',
        totalAmount: '',
        fees: '0',
        realizedPL: '',
        notes: ''
      })
    }
  }

  const buildPayload = (data) => {
    return buildInvestmentTransactionPayload({
      date: formatDateForSheet(data.date),
      investmentAccount: data.investmentAccount,
      type: data.type,
      assetName: data.assetName,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit.replace(/,/g, ''),
      totalAmount: data.totalAmount.replace(/,/g, ''),
      fees: data.fees.replace(/,/g, '') || '0',
      realizedPL: data.realizedPL.replace(/,/g, '') || '',
      notes: data.notes
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
      await createInvestmentTransaction(payload)

      showMessage('Giao dịch đầu tư đã được lưu thành công!')
      resetForm(mode === 'batch')
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
      id: Date.now()
    }

    setTransactions([...transactions, newTransaction])
    resetForm(true)
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
      await createBatchInvestmentTransactions(payload)

      showMessage(`${transactions.length} giao dịch đầu tư đã được lưu thành công!`)
      setTransactions([])
      await clearSavedTransactions()
      setTimeout(() => onClose && onClose(), 1500)
    } catch (error) {
      showMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const MessageDisplay = () => message && (
    <div
      className={`p-3 rounded-lg text-sm animate-fadeIn ${
        message.includes('thành công') || message.includes('thêm')
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center">
        {message.includes('thành công') || message.includes('thêm') ? (
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  )

  // Form fields
  const FormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          label="Ngày"
          value={formData.date}
          onChange={(date) => setFormData(prev => ({ ...prev, date }))}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tài khoản
          </label>
          <select
            name="investmentAccount"
            value={formData.investmentAccount}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {accounts.length === 0 ? (
              <option value="INV001">INV001 (Default)</option>
            ) : (
              accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loại giao dịch
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={INVESTMENT_TYPES.BUY}>Mua (Buy)</option>
          <option value={INVESTMENT_TYPES.SELL}>Bán (Sell)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên tài sản <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="assetName"
          value={formData.assetName}
          onChange={handleInputChange}
          placeholder="VD: VNM, BTC, EURUSD..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleNumberInput}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá / đơn vị <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleCurrencyInput}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tổng tiền
          </label>
          <input
            type="text"
            name="totalAmount"
            value={formData.totalAmount}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phí giao dịch
          </label>
          <input
            type="text"
            name="fees"
            value={formData.fees}
            onChange={handleCurrencyInput}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {formData.type === INVESTMENT_TYPES.SELL && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lãi/Lỗ thực hiện
          </label>
          <input
            type="text"
            name="realizedPL"
            value={formData.realizedPL}
            onChange={handleCurrencyInput}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </>
  )

  // Single mode render
  if (mode === 'single') {
    return (
      <form
        ref={formRef}
        onSubmit={handleSingleSubmit}
        className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 space-y-5 animate-slideIn"
      >
        <FormFields />

        <MessageDisplay />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu Giao Dịch'}
        </button>
      </form>
    )
  }

  // Batch mode render
  return (
    <div className="space-y-4 mb-4">
      {/* Transaction Queue */}
      <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 animate-slideIn">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Thêm nhiều giao dịch đầu tư</h2>
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
                      <div className="font-medium text-sm">{t.assetName} ({t.type})</div>
                      <div className="text-xs text-gray-500">{t.quantity} × {t.pricePerUnit}</div>
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
      <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 space-y-5 animate-slideIn">
        <FormFields />

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

export default InvestmentTransactionForm
