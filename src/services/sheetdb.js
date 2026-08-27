import { indexedDBService } from './indexedDB'

// Data layer. Talks to our own Cloudflare Worker (same origin, /api), which
// holds the Google service-account key and forwards to the Google Sheets API.
// SheetDB is no longer used. The Worker keeps SheetDB's contract:
//   GET  /api/rows?sheet=<tab>&limit=<n>  -> array of row-objects (keyed by header)
//   POST /api/rows  { data: [rowObjects], sheet: <tab> }  -> appends rows
// Every call carries the shared password as `Authorization: Bearer <password>`.
const API_BASE = '/api'
const SHEET_NAME = 'Giao Dịch'
const INVESTMENT_SHEET_NAME = 'Giao Dịch Investment'
const SETUP_SHEET_NAME = 'Setup Finanace' // Note: typo in sheet name
const INVESTMENT_ACCOUNT_SHEET_NAME = 'Investment Account'

// The stored "apiToken" setting is repurposed as the shared app password.
const getAuthToken = async () => {
  const savedToken = await indexedDBService.getSetting('apiToken')
  return savedToken || import.meta.env.VITE_APP_PASSWORD || ''
}

const authHeaders = async (extra = {}) => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${await getAuthToken()}`,
  ...extra,
})

// Read rows from a tab (array of objects keyed by header) — same shape SheetDB returned.
const readSheet = async (sheet, limit) => {
  const params = new URLSearchParams({ sheet })
  if (limit) params.set('limit', String(limit))
  const response = await fetch(`${API_BASE}/rows?${params.toString()}`, {
    method: 'GET',
    headers: await authHeaders(),
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Append rows to a tab. `data` is an array of row-objects keyed by header name.
const appendToSheet = async (data, sheet) => {
  const response = await fetch(`${API_BASE}/rows`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data, sheet }),
  })
  if (!response.ok) {
    const errorData = await response.text()
    console.error('API Error Response:', errorData)
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Upload a captured image (JPEG data URL) to the Worker -> returns a public URL
// (served from R2 at /img/<key>) suitable for =IMAGE() in the sheet.
export const uploadImage = async (dataUrl) => {
  const response = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ dataUrl }),
  })
  if (!response.ok) {
    const errorData = await response.text()
    console.error('Image upload error:', errorData)
    throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.')
  }
  const result = await response.json()
  return result.url
}

export const getSheetColumns = async () => {
  try {
    const data = await readSheet(SHEET_NAME, 1)
    console.log('Sheet columns:', data[0] ? Object.keys(data[0]) : 'No data')
    return data[0] ? Object.keys(data[0]) : []
  } catch (error) {
    console.error('Error fetching sheet columns:', error)
    return []
  }
}

export const createTransaction = async (transactionData) => {
  try {
    const result = await appendToSheet([transactionData], SHEET_NAME)
    console.log('API Response:', result)
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
    'Month': "=TEXT(DATEVALUE(\"" + formData.month + "\"), \"yyyy/MM\")", // Formula to ensure correct date format in Google Sheets
  }

  if (formData.type === 'Chi Tiêu') {
    data['Chi Tiêu Category'] = `=IFERROR(INDEX('Setup Finanace'!$G$15:$G$24,MATCH("${formData.category}",'Setup Finanace'!$F$15:$F$24,0)),"")`
  }

  return data;
}

export const fetchCategories = async () => {
  try {
    const data = await readSheet(SETUP_SHEET_NAME)

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
    const result = await appendToSheet(transactionsData, SHEET_NAME)
    console.log('API Batch Response:', result)
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
    const result = await appendToSheet([transactionData], INVESTMENT_SHEET_NAME)
    console.log('API Investment Response:', result)
    return result
  } catch (error) {
    console.error('Error creating investment transaction:', error)
    throw new Error('Không thể lưu giao dịch đầu tư. Vui lòng thử lại.')
  }
}

export const createBatchInvestmentTransactions = async (transactionsData) => {
  try {
    const result = await appendToSheet(transactionsData, INVESTMENT_SHEET_NAME)
    console.log('API Batch Investment Response:', result)
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
    const data = await readSheet(INVESTMENT_ACCOUNT_SHEET_NAME)

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
