/**
 * Linked transaction checkbox component
 * Extracted for reusability and clarity
 */

import { INVESTMENT_TYPES } from '../../constants/categories'

const LinkedTransactionOption = ({ transactionType, checked, onChange }) => {
  const linkedTypeText = transactionType === INVESTMENT_TYPES.BUY
    ? 'Chuyển Tiền Vào Tài Khoản'
    : 'Rút Tiền Ra Tài Khoản'

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border-2 border-green-200">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
        <span className="ml-3 text-sm font-medium text-gray-700">
          Tạo giao dịch liên kết trong "Giao Dịch" chính
          <span className="block text-xs text-gray-500 mt-1">
            {linkedTypeText}
          </span>
        </span>
      </label>
    </div>
  )
}

export default LinkedTransactionOption
