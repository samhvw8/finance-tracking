import { useState, useEffect, useRef } from 'react'
import { formatDateForSheet } from '../utils/formatters'
import { createInvestmentTransaction, createBatchInvestmentTransactions, buildInvestmentTransactionPayload } from '../services/sheetdb'
import { indexedDBService } from '../services/indexedDB'
import { investmentAccountsManager } from '../services/investmentAccountsManager'
import { INVESTMENT_TYPES } from '../constants/categories'
import DatePicker from './DatePicker'

// Form fields component - extracted outside to prevent re-creation on every render
const FormFields = ({ formData, setFormData, accounts, handleInputChange, handleNumberInput, handleCurrencyInput }) => (
  <div className="space-y-4">
    {/* Transaction Type - Prominent on mobile */}
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Loại Giao Dịch
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: INVESTMENT_TYPES.BUY }))}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            formData.type === INVESTMENT_TYPES.BUY
              ? 'bg-green-500 text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
          }`}
        >
          <span className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mua
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: INVESTMENT_TYPES.SELL }))}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            formData.type === INVESTMENT_TYPES.SELL
              ? 'bg-red-500 text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
          }`}
        >
          <span className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Bán
          </span>
        </button>
      </div>
    </div>

    {/* Date and Account */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <DatePicker
          label="Ngày"
          value={formData.date}
          onChange={(date) => setFormData(prev => ({ ...prev, date }))}
          required
        />
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Tài Khoản
        </label>
        <select
          name="investmentAccount"
          value={formData.investmentAccount}
          onChange={handleInputChange}
          className="w-full px-3 py-2.5 text-sm border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
        >
          {accounts.length === 0 ? (
            <option value="INV001">INV001</option>
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

    {/* Asset Name - Full width for better typing */}
    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-blue-200">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Tên Tài Sản <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="assetName"
        value={formData.assetName}
        onChange={handleInputChange}
        placeholder="VD: VNM, BTC, TSLA..."
        className="w-full px-4 py-3 text-lg font-semibold border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        required
        autoCapitalize="characters"
      />
    </div>

    {/* Quantity and Price */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Số Lượng <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          name="quantity"
          value={formData.quantity}
          onChange={handleNumberInput}
          placeholder="0"
          className="w-full px-3 py-2.5 text-base font-semibold border-0 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-700"
          required
        />
      </div>

      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Giá/ĐV <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          name="pricePerUnit"
          value={formData.pricePerUnit}
          onChange={handleCurrencyInput}
          placeholder="0"
          className="w-full px-3 py-2.5 text-base font-semibold border-0 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500 text-green-700"
          required
        />
      </div>
    </div>

    {/* Total Amount - Highlighted */}
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl shadow-lg">
      <label className="block text-xs font-semibold text-purple-100 uppercase tracking-wide mb-2">
        💰 Tổng Tiền
      </label>
      <div className="text-2xl font-bold text-white">
        {formData.totalAmount || '0'} ₫
      </div>
    </div>

    {/* Fees */}
    <div className="bg-white p-3 rounded-xl border border-gray-200">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Phí Giao Dịch
      </label>
      <input
        type="text"
        inputMode="numeric"
        name="fees"
        value={formData.fees}
        onChange={handleCurrencyInput}
        placeholder="0"
        className="w-full px-3 py-2.5 text-sm border-0 bg-orange-50 rounded-lg focus:ring-2 focus:ring-orange-500 text-orange-700 font-medium"
      />
    </div>

    {/* Realized P&L for Sell */}
    {formData.type === INVESTMENT_TYPES.SELL && (
      <div className="bg-white p-3 rounded-xl border border-gray-200 animate-fadeIn">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Lãi/Lỗ Thực Hiện
        </label>
        <input
          type="text"
          inputMode="numeric"
          name="realizedPL"
          value={formData.realizedPL}
          onChange={handleCurrencyInput}
          placeholder="0"
          className="w-full px-3 py-2.5 text-sm border-0 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500 text-yellow-700 font-medium"
        />
      </div>
    )}

    {/* Notes */}
    <div className="bg-white p-3 rounded-xl border border-gray-200">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Ghi Chú
      </label>
      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleInputChange}
        rows="2"
        placeholder="Thêm ghi chú (tùy chọn)..."
        className="w-full px-3 py-2.5 text-sm border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-gray-300 resize-none placeholder-gray-400"
      />
    </div>
  </div>
)

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

  // Single mode render
  if (mode === 'single') {
    return (
      <form
        ref={formRef}
        onSubmit={handleSingleSubmit}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 sm:p-6 animate-slideIn pb-24 sm:pb-6"
      >
        <FormFields
          formData={formData}
          setFormData={setFormData}
          accounts={accounts}
          handleInputChange={handleInputChange}
          handleNumberInput={handleNumberInput}
          handleCurrencyInput={handleCurrencyInput}
        />

        <MessageDisplay />

        {/* Desktop Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="hidden sm:flex w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg items-center justify-center mt-6"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lưu Giao Dịch
            </>
          )}
        </button>

        {/* Mobile Floating Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="sm:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 z-50 flex items-center justify-center"
          style={{ width: '72px', height: '72px' }}
          aria-label="Lưu giao dịch"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
        <FormFields
          formData={formData}
          setFormData={setFormData}
          accounts={accounts}
          handleInputChange={handleInputChange}
          handleNumberInput={handleNumberInput}
          handleCurrencyInput={handleCurrencyInput}
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

export default InvestmentTransactionForm
