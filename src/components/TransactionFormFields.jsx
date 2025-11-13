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
    <fieldset className={`space-y-4 ${className}`} aria-label="Thông tin giao dịch">
      <div>
        <label htmlFor="transaction-date" className="block text-sm font-semibold text-gray-700 mb-2">
          Ngày *
        </label>
        <DatePicker
          id="transaction-date"
          value={formData.date}
          onChange={(date) => handleInputChange('date', date)}
          allowFuture={true}
          aria-describedby="date-help"
        />
        <div id="date-help" className="sr-only">
          Chọn ngày thực hiện giao dịch.
        </div>
      </div>
      
      <div>
        <label htmlFor="transaction-type" className="block text-sm font-semibold text-gray-700 mb-2">
          Loại Giao Dịch *
        </label>
        <select
          id="transaction-type"
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
          aria-describedby="type-help"
        >
          {Object.values(TRANSACTION_TYPES).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div id="type-help" className="sr-only">
          Chọn loại giao dịch: Thu nhập cho tiền vào, Chi tiêu cho tiền ra, Đầu tư hoặc Rút đầu tư.
        </div>
      </div>
      
      <div>
        <label htmlFor="transaction-category" className="block text-sm font-semibold text-gray-700 mb-2">
          Danh Mục
        </label>
        <select
          id="transaction-category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
          aria-describedby="category-help"
        >
          <option value="">Chọn danh mục</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div id="category-help" className="sr-only">
          Chọn danh mục phù hợp với loại giao dịch. Nếu không chọn, sẽ mặc định là "Khác".
        </div>
      </div>
      
      <div>
        <label htmlFor="transaction-name" className="block text-sm font-semibold text-gray-700 mb-2">
          Tên Giao Dịch
        </label>
        <input
          id="transaction-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Nhập mô tả giao dịch"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 placeholder-gray-400"
          aria-describedby="name-help"
        />
        <div id="name-help" className="sr-only">
          Nhập tên hoặc mô tả cho giao dịch này. Trường này không bắt buộc.
        </div>
      </div>
      
      <div>
        <label htmlFor="transaction-amount" className="block text-sm font-semibold text-gray-700 mb-2">
          Số Tiền *
        </label>
        <AmountInput
          id="transaction-amount"
          value={formData.amount}
          onChange={(amount) => handleInputChange('amount', amount)}
          aria-describedby="amount-help"
        />
        <div id="amount-help" className="sr-only">
          Nhập số tiền giao dịch bằng đồng Việt Nam. Chỉ nhập số dương.
        </div>
      </div>
      
      <div>
        <label htmlFor="transaction-note" className="block text-sm font-semibold text-gray-700 mb-2">
          Ghi Chú
        </label>
        <textarea
          id="transaction-note"
          value={formData.note}
          onChange={(e) => handleInputChange('note', e.target.value)}
          placeholder="Ghi chú thêm (không bắt buộc)"
          rows={2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none placeholder-gray-400"
          aria-describedby="note-help"
        />
        <div id="note-help" className="sr-only">
          Thêm ghi chú bổ sung cho giao dịch nếu cần. Trường này không bắt buộc.
        </div>
      </div>
    </fieldset>
  )
}

export default TransactionFormFields