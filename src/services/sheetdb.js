import { indexedDBService } from './indexedDB'

const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/otpxy27h47ofu'
const SHEET_NAME = 'Giao Dịch'
const INVESTMENT_SHEET_NAME = 'Giao Dich Investment'
const SETUP_SHEET_NAME = 'Setup Finanace' // Note: typo in sheet name
const INVESTMENT_ACCOUNT_SHEET_NAME = 'Investment Account'

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
  let data =  {
    'Date': formData.date,
    'Type': formData.type,
    'Category': formData.category,
    'Tên': formData.name,
    'Số Tiền': formData.amount,
    'Note': formData.note || '',
    'Month': "=TEXT(DATEVALUE(\"" + formData.month + "\"), \"MM/yyyy\")", // Formula to ensure correct date format in Google Sheets
  }

  if (formData.type === 'Chi Tiêu') {
    data['Chi Tiêu Category'] = `=IFERROR(INDEX('Setup Finanace'!$G$15:$G$24,MATCH("${formData.category}",'Setup Finanace'!$F$15:$F$24,0)),"")`
  }

  return data;
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
      'Chuyển Tiền Vào Tài Khoản': [],
      'Rút Tiền Ra Tài Khoản': []
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

// Investment Transaction Functions
export const buildInvestmentTransactionPayload = (formData) => {
  return {
    'Date': formData.date,
    'Investment Account': formData.investmentAccount,
    'Type': formData.type,
    'Asset Name': formData.assetName,
    'Quantity': formData.quantity,
    'Price per Unit': formData.pricePerUnit,
    'Total Amount': formData.totalAmount,
    'Fees': formData.fees || '0',
    'Realized P&L': formData.realizedPL || '',
    'Notes': formData.notes || ''
  }
}

export const createInvestmentTransaction = async (transactionData) => {
  try {
    const token = await getAuthToken()
    const payload = {
      data: [transactionData],
      sheet: INVESTMENT_SHEET_NAME
    }

    console.log('Sending investment transaction to SheetDB:', JSON.stringify(payload, null, 2))

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
    console.log('SheetDB Investment Response:', result)
    return result
  } catch (error) {
    console.error('Error creating investment transaction:', error)
    throw new Error('Không thể lưu giao dịch đầu tư. Vui lòng thử lại.')
  }
}

export const createBatchInvestmentTransactions = async (transactionsData) => {
  try {
    const token = await getAuthToken()
    const payload = {
      data: transactionsData,
      sheet: INVESTMENT_SHEET_NAME
    }

    console.log('Sending batch investment transactions to SheetDB:', JSON.stringify(payload, null, 2))

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
    console.log('SheetDB Batch Investment Response:', result)
    return result
  } catch (error) {
    console.error('Error creating batch investment transactions:', error)
    throw new Error('Không thể lưu các giao dịch đầu tư. Vui lòng thử lại.')
  }
}

// Create investment transaction with linked main transaction
export const createInvestmentWithLinkedTransaction = async (investmentData, mainTransactionData) => {
  try {
    // Create investment transaction
    await createInvestmentTransaction(investmentData)

    // Create linked main transaction
    await createTransaction(mainTransactionData)

    console.log('Both investment and linked transaction created successfully')
    return { success: true }
  } catch (error) {
    console.error('Error creating investment with linked transaction:', error)
    throw new Error('Không thể lưu giao dịch. Vui lòng thử lại.')
  }
}

// Create batch investment transactions with linked main transactions
export const createBatchInvestmentWithLinkedTransactions = async (investmentTransactionsData, mainTransactionsData) => {
  try {
    // Create batch investment transactions
    await createBatchInvestmentTransactions(investmentTransactionsData)

    // Create batch linked main transactions
    await createBatchTransactions(mainTransactionsData)

    console.log('Both batch investment and linked transactions created successfully')
    return { success: true }
  } catch (error) {
    console.error('Error creating batch investment with linked transactions:', error)
    throw new Error('Không thể lưu các giao dịch. Vui lòng thử lại.')
  }
}

// Investment Accounts Functions
export const fetchInvestmentAccounts = async () => {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${SHEETDB_API_URL}?sheet=${INVESTMENT_ACCOUNT_SHEET_NAME}`, {
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

    // Extract account IDs from the data
    // Assuming the sheet has columns like: Account ID, Account Name, Type, etc.
    const accounts = data
      .filter(row => row['Account ID'] && row['Account ID'].trim())
      .map(row => ({
        id: row['Account ID'].trim(),
        name: row['Account Name'] ? row['Account Name'].trim() : row['Account ID'].trim(),
        type: row['Type'] ? row['Type'].trim() : 'Unknown'
      }))

    // Remove duplicates based on ID
    const uniqueAccounts = accounts.filter((account, index, self) =>
      index === self.findIndex(a => a.id === account.id)
    )

    return uniqueAccounts
  } catch (error) {
    console.error('Error fetching investment accounts:', error)
    throw new Error('Không thể tải danh sách tài khoản. Vui lòng thử lại.')
  }
}