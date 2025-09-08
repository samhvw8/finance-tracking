const DB_NAME = 'FinanceTrackingDB'
const DB_VERSION = 1
const STORES = {
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  TRANSACTIONS_QUEUE: 'transactionsQueue'
}

class IndexedDBService {
  constructor() {
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Categories store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
        }
        
        // Settings store (for API token)
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }
        
        // Transactions queue for batch processing
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS_QUEUE)) {
          db.createObjectStore(STORES.TRANSACTIONS_QUEUE, { 
            keyPath: 'id',
            autoIncrement: true 
          })
        }
      }
    })
  }

  async saveCategories(categories) {
    const tx = this.db.transaction([STORES.CATEGORIES], 'readwrite')
    const store = tx.objectStore(STORES.CATEGORIES)
    
    await store.clear()
    await store.put({
      id: 'categories',
      data: categories,
      updatedAt: new Date().toISOString()
    })
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getCategories() {
    const tx = this.db.transaction([STORES.CATEGORIES], 'readonly')
    const store = tx.objectStore(STORES.CATEGORIES)
    
    return new Promise((resolve, reject) => {
      const request = store.get('categories')
      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }

  async saveSetting(key, value) {
    const tx = this.db.transaction([STORES.SETTINGS], 'readwrite')
    const store = tx.objectStore(STORES.SETTINGS)
    
    await store.put({ key, value })
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getSetting(key) {
    const tx = this.db.transaction([STORES.SETTINGS], 'readonly')
    const store = tx.objectStore(STORES.SETTINGS)
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  async addToQueue(transaction) {
    const tx = this.db.transaction([STORES.TRANSACTIONS_QUEUE], 'readwrite')
    const store = tx.objectStore(STORES.TRANSACTIONS_QUEUE)
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...transaction,
        queuedAt: new Date().toISOString()
      })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getQueuedTransactions() {
    const tx = this.db.transaction([STORES.TRANSACTIONS_QUEUE], 'readonly')
    const store = tx.objectStore(STORES.TRANSACTIONS_QUEUE)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async clearQueue(ids) {
    const tx = this.db.transaction([STORES.TRANSACTIONS_QUEUE], 'readwrite')
    const store = tx.objectStore(STORES.TRANSACTIONS_QUEUE)
    
    for (const id of ids) {
      await store.delete(id)
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async clearAllQueue() {
    const tx = this.db.transaction([STORES.TRANSACTIONS_QUEUE], 'readwrite')
    const store = tx.objectStore(STORES.TRANSACTIONS_QUEUE)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const indexedDBService = new IndexedDBService()
export const initDB = () => indexedDBService.init()