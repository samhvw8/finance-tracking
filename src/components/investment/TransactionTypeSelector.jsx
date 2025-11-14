/**
 * Transaction type selector component (Buy/Sell)
 * Extracted from FormFields for better separation of concerns
 */

import { INVESTMENT_TYPES } from '../../constants/categories'

const TransactionTypeSelector = ({ selectedType, onTypeChange }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Loại Giao Dịch
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTypeChange(INVESTMENT_TYPES.BUY)}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            selectedType === INVESTMENT_TYPES.BUY
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
          onClick={() => onTypeChange(INVESTMENT_TYPES.SELL)}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            selectedType === INVESTMENT_TYPES.SELL
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
  )
}

export default TransactionTypeSelector
