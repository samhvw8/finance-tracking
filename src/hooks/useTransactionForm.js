import { useState, useEffect } from 'react'
import { TRANSACTION_TYPES } from '../constants/categories'
import { categoriesManager } from '../services/categoriesManager'

const initialFormData = {
  date: new Date(),
  type: TRANSACTION_TYPES.EXPENSE,
  category: '',
  name: '',
  amount: 0,
  note: ''
}

export const useTransactionForm = (initialData = null, onFormDataChange = null) => {
  const [formData, setFormData] = useState(initialData || initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState({})
  
  useEffect(() => {
    const unsubscribe = categoriesManager.subscribe(updatedCategories => {
      setCategories(updatedCategories || {})
    })
    
    setCategories(categoriesManager.getCategories())
    
    return unsubscribe
  }, [])
  
  const handleInputChange = (field, value) => {
    const updatedFormData = {
      ...formData,
      [field]: value,
      ...(field === 'type' ? { category: '' } : {})
    }
    setFormData(updatedFormData)
    
    // Report form data changes to parent if callback provided
    if (onFormDataChange) {
      onFormDataChange(updatedFormData)
    }
  }
  
  const validateForm = () => {
    if (!formData.type) return 'Vui lòng chọn loại giao dịch'
    if (formData.amount <= 0) return 'Vui lòng nhập số tiền hợp lệ'
    if (formData.date > new Date()) return 'Ngày không thể trong tương lai'
    return null
  }
  
  const resetForm = (keepDateAndType = false) => {
    if (keepDateAndType) {
      setFormData({
        date: formData.date,
        type: formData.type,
        category: '',
        name: '',
        amount: 0,
        note: ''
      })
    } else {
      setFormData(initialFormData)
    }
  }
  
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg)
    if (duration > 0) {
      setTimeout(() => setMessage(''), duration)
    }
  }
  
  return {
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    message,
    categories,
    handleInputChange,
    validateForm,
    resetForm,
    showMessage
  }
}