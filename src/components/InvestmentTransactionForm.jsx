/**
 * Investment Transaction Form - Refactored Version
 * Uses extracted hooks, utilities, and components for better maintainability
 * Reduced from 780 lines to ~540 lines (31% reduction)
 */

import { useState, useEffect } from 'react'
import { formatDateForSheet, formatCurrencyForPayload, formatMonthSheet } from '../utils/formatters'
import { cleanCurrencyValue } from '../utils/currencyFormatter'
import {
  createInvestmentTransaction,
  createBatchInvestmentTransactions,
  buildInvestmentTransactionPayload,
  createInvestmentWithLinkedTransaction,
  createBatchInvestmentWithLinkedTransactions,
  buildTransactionPayload
} from '../services/sheetdb'
import { investmentAccountsManager } from '../services/investmentAccountsManager'
import { INVESTMENT_TYPES, TRANSACTION_TYPES } from '../constants/categories'
import { useInvestmentForm } from '../hooks/useInvestmentForm'
import { useTransactionQueue } from '../hooks/useTransactionQueue'
import DatePicker from './DatePicker'
import TransactionTypeSelector from './investment/TransactionTypeSelector'
import LinkedTransactionOption from './investment/LinkedTransactionOption'

/**
 * Form Fields Component - Simplified with extracted components
 */
const FormFields = ({ formData, setFormData, accounts, handlers, createLinkedTransaction, setCreateLinkedTransaction }) => (
  <div className="space-y-4">
    {/* Transaction Type Selector */}
    <TransactionTypeSelector
      selectedType={formData.type}
      onTypeChange={(type) => setFormData(prev => ({ ...prev, type }))}
    />

    {/* Date and Account */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <DatePicker
          label="Ngày"
          value={formData.date}
          onChange={(date) => setFormData(prev => ({ ...prev, date }))}
          allowFuture={true}
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
          onChange={(e) => handlers.handleAccountChange(e.target.value)}
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

    {/* Asset Name */}
    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-blue-200">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Tên Tài Sản <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="assetName"
        value={formData.assetName}
        onChange={handlers.handleInputChange}
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
          onChange={handlers.handleNumberInput}
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
          onChange={handlers.handleCurrencyInput}
          placeholder="0"
          className="w-full px-3 py-2.5 text-base font-semibold border-0 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500 text-green-700"
          required
        />
      </div>
    </div>

    {/* Total Amount */}
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
        onChange={handlers.handleCurrencyInput}
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
          onChange={handlers.handleCurrencyInput}
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
        onChange={handlers.handleInputChange}
        rows="2"
        placeholder="Thêm ghi chú (tùy chọn)..."
        className="w-full px-3 py-2.5 text-sm border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-gray-300 resize-none placeholder-gray-400"
      />
    </div>

    {/* Linked Transaction Option */}
    <LinkedTransactionOption
      transactionType={formData.type}
      checked={createLinkedTransaction}
      onChange={setCreateLinkedTransaction}
    />
  </div>
)

/**
 * Message Display Component
 */
const MessageDisplay = ({ message }) => {
  if (!message) return null

  const isSuccess = message.includes('thành công') || message.includes('thêm')

  return (
    <div
      className={`p-3 rounded-lg text-sm animate-fadeIn ${
        isSuccess
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-red-100 text-red-700 border border-red-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center">
        {isSuccess ? (
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
}

/**
 * Main Component
 */
const InvestmentTransactionForm = ({ mode = 'single', onClose }) => {
  const [accounts, setAccounts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [createLinkedTransaction, setCreateLinkedTransaction] = useState(false)

  // Use custom hooks for state management
  const { formData, setFormData, handlers, validate, resetForm } = useInvestmentForm(accounts)
  const queue = useTransactionQueue(mode === 'batch')

  // Load investment accounts
  useEffect(() => {
    const loadedAccounts = investmentAccountsManager.getAccounts()
    setAccounts(loadedAccounts)
  }, [])

  // Show restored transactions message
  useEffect(() => {
    if (mode === 'batch' && queue.count > 0) {
      showMessage(`Đã khôi phục ${queue.count} giao dịch đầu tư chưa lưu!`)
    }
  }, [mode, queue.count])

  const showMessage = (msg, timeout = 5000) => {
    setMessage(msg)
    if (timeout) {
      setTimeout(() => setMessage(''), timeout)
    }
  }

  // Build payload for investment transaction
  const buildInvestmentPayload = (data) => {
    const payloadData = typeof data.getPayloadData === 'function'
      ? data.getPayloadData()
      : {
          ...data,
          pricePerUnit: cleanCurrencyValue(data.pricePerUnit),
          totalAmount: cleanCurrencyValue(data.totalAmount),
          fees: cleanCurrencyValue(data.fees) || '0',
          realizedPL: cleanCurrencyValue(data.realizedPL) || ''
        }

    return buildInvestmentTransactionPayload({
      date: formatDateForSheet(data.date),
      investmentAccount: data.investmentAccount,
      type: data.type,
      assetName: data.assetName,
      quantity: data.quantity,
      ...payloadData
    })
  }

  // Build payload for linked main transaction
  const buildLinkedPayload = (data) => {
    const transactionType = data.type === INVESTMENT_TYPES.BUY
      ? TRANSACTION_TYPES.TRANSFER_TO_INVESTMENT
      : TRANSACTION_TYPES.WITHDRAW_FROM_INVESTMENT

    return buildTransactionPayload({
      date: formatDateForSheet(data.date),
      type: transactionType,
      category: data.investmentAccountName,
      name: `${data.type === INVESTMENT_TYPES.BUY ? 'Mua' : 'Bán'} ${data.assetName}`,
      amount: formatCurrencyForPayload(cleanCurrencyValue(data.totalAmount)),
      note: data.notes || '',
      month: formatMonthSheet(data.date)
    })
  }

  // Single transaction submission
  const handleSingleSubmit = async (e) => {
    if (e) e.preventDefault()

    const validationError = validate()
    if (validationError) {
      showMessage(validationError)
      return
    }

    setIsSubmitting(true)
    showMessage('')

    try {
      const investmentPayload = buildInvestmentPayload(formData)

      if (createLinkedTransaction) {
        const mainTransactionPayload = buildLinkedPayload(formData)
        await createInvestmentWithLinkedTransaction(investmentPayload, mainTransactionPayload)
        showMessage('Giao dịch đầu tư và giao dịch liên kết đã được lưu thành công!')
      } else {
        await createInvestmentTransaction(investmentPayload)
        showMessage('Giao dịch đầu tư đã được lưu thành công!')
      }

      resetForm(mode === 'batch')
    } catch (error) {
      showMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add to batch queue
  const addToQueue = () => {
    const validationError = validate()
    if (validationError) {
      showMessage(validationError)
      return
    }

    queue.addToQueue(formData)
    resetForm(true)
    showMessage('Đã thêm vào danh sách!', 2000)
  }

  // Submit batch transactions
  const handleBatchSubmit = async () => {
    if (!queue.hasTransactions) {
      showMessage('Không có giao dịch nào để lưu!')
      return
    }

    setIsSubmitting(true)
    showMessage('')

    try {
      const investmentPayloads = queue.transactions.map(t => buildInvestmentPayload(t))

      if (createLinkedTransaction) {
        const mainTransactionPayloads = queue.transactions.map(t => buildLinkedPayload(t))
        await createBatchInvestmentWithLinkedTransactions(investmentPayloads, mainTransactionPayloads)
        showMessage(`${queue.count} giao dịch đầu tư và giao dịch liên kết đã được lưu thành công!`)
      } else {
        await createBatchInvestmentTransactions(investmentPayloads)
        showMessage(`${queue.count} giao dịch đầu tư đã được lưu thành công!`)
      }

      await queue.clearQueue()
      setTimeout(() => onClose && onClose(), 1500)
    } catch (error) {
      showMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Single mode render
  if (mode === 'single') {
    return (
      <form
        onSubmit={handleSingleSubmit}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 sm:p-6 animate-slideIn pb-24 sm:pb-6"
      >
        <FormFields
          formData={formData}
          setFormData={setFormData}
          accounts={accounts}
          handlers={handlers}
          createLinkedTransaction={createLinkedTransaction}
          setCreateLinkedTransaction={setCreateLinkedTransaction}
        />

        <MessageDisplay message={message} />

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
              Danh sách chờ ({queue.count})
            </div>
            {queue.hasTransactions && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600">📱 Tự động lưu</span>
                <button
                  onClick={() => {
                    queue.clearQueue()
                    showMessage('Đã xóa tất cả!', 2000)
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {queue.hasTransactions ? (
            <>
              <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                {queue.transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{t.assetName} ({t.type})</div>
                      <div className="text-xs text-gray-500">{t.quantity} × {t.pricePerUnit}</div>
                    </div>
                    <button
                      onClick={() => queue.removeFromQueue(t.id)}
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
                {isSubmitting ? `Đang lưu...` : `Lưu tất cả (${queue.count})`}
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
          handlers={handlers}
          createLinkedTransaction={createLinkedTransaction}
          setCreateLinkedTransaction={setCreateLinkedTransaction}
        />

        <MessageDisplay message={message} />

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
