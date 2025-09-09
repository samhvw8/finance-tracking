import { TRANSACTION_TYPES } from '../constants/categories'
import DatePicker from './DatePicker'
import AmountInput from './AmountInput'

const TransactionFormFields = ({ 
  formData, 
  handleInputChange, 
  categories,
  className = ''
}) => {
  const availableCategories = categories[formData.type] || []
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ngày
        </label>
        <DatePicker
          value={formData.date}
          onChange={(date) => handleInputChange('date', date)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Loại Giao Dịch
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
        >
          {Object.values(TRANSACTION_TYPES).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Danh Mục
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
        >
          <option value="">Chọn danh mục</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tên Giao Dịch
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Nhập mô tả giao dịch"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder-gray-400"
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Số Tiền
        </label>
        <AmountInput
          value={formData.amount}
          onChange={(amount) => handleInputChange('amount', amount)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ghi Chú
        </label>
        <textarea
          value={formData.note}
          onChange={(e) => handleInputChange('note', e.target.value)}
          placeholder="Ghi chú thêm (không bắt buộc)"
          rows={2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none placeholder-gray-400"
        />
      </div>
    </div>
  )
}

export default TransactionFormFields