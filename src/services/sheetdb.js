import { indexedDBService } from './indexedDB'

const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/otpxy27h47ofu'
const SHEET_NAME = 'Giao Dịch'
const SETUP_SHEET_NAME = 'Setup Finanace' // Note: typo in sheet name

const getAuthToken = async () => {
  const savedToken = await indexedDBService.getSetting('apiToken')
  return savedToken || import.meta.env.VITE_SHEETDB_TOKEN || 'token---'
}

export const getSheetColumns = async () => {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${SHEETDB_API_URL}?limit=1&sheet=${SHEET_NAME}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Sheet columns:', data[0] ? Object.keys(data[0]) : 'No data')
    return data[0] ? Object.keys(data[0]) : []
  } catch (error) {
    console.error('Error fetching sheet columns:', error)
    return []
  }
}

export const createTransaction = async (transactionData) => {
  try {
    const token = await getAuthToken()
    const payload = {
      data: [transactionData],
      sheet: SHEET_NAME
    }
    
    console.log('Sending to SheetDB:', JSON.stringify(payload, null, 2))
    
    const response = await fetch(SHEETDB_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SheetDB Error Response:', errorData)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('SheetDB Response:', result)
    return result
  } catch (error) {
    console.error('Error creating transaction:', error)
    throw new Error('Không thể lưu giao dịch. Vui lòng thử lại.')
  }
}

export const buildTransactionPayload = (formData) => {
  return {
    'Date': formData.date,
    'Type': formData.type,
    'Category': formData.category,
    'Tên': formData.name,
    'Số Tiền': formData.amount,
    'Note': formData.note || '',
  }
}

export const fetchCategories = async () => {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${SHEETDB_API_URL}?sheet=${SETUP_SHEET_NAME}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform data into categories structure
    const categories = {
      'Thu Nhập': [],
      'Chi Tiêu': [],
      'Đầu Tư': [],
      'Rút Đầu Tư': []
    }
    
    data.forEach(row => {
      Object.keys(categories).forEach(type => {
        if (row[type] && row[type].trim()) {
          categories[type].push(row[type].trim())
        }
      })
    })
    
    // Remove duplicates and sort
    Object.keys(categories).forEach(type => {
      categories[type] = [...new Set(categories[type])].sort()
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Không thể tải danh mục. Vui lòng thử lại.')
  }
}

export const createBatchTransactions = async (transactionsData) => {
  try {
    const token = await getAuthToken()
    const payload = {
      data: transactionsData,
      sheet: SHEET_NAME
    }
    
    console.log('Sending batch to SheetDB:', JSON.stringify(payload, null, 2))
    
    const response = await fetch(SHEETDB_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SheetDB Error Response:', errorData)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('SheetDB Batch Response:', result)
    return result
  } catch (error) {
    console.error('Error creating batch transactions:', error)
    throw new Error('Không thể lưu các giao dịch. Vui lòng thử lại.')
  }
}