import { fetchCategories } from './sheetdb'
import { indexedDBService } from './indexedDB'
import { TRANSACTION_TYPES } from '../constants/categories'

class CategoriesManager {
  constructor() {
    this.categories = null
    this.isLoading = false
    this.listeners = []
  }

  async initialize() {
    // Load from IndexedDB first
    try {
      const cached = await indexedDBService.getCategories()
      if (cached) {
        this.categories = cached
        this.notifyListeners()
        return // Use cached data, don't try API on initialization
      }
    } catch (error) {
      console.error('Error loading cached categories:', error)
    }
    
    // If no cached data, try to load from API but don't fail initialization
    if (!this.categories) {
      try {
        await this.loadFromAPI()
      } catch (error) {
        console.warn('Failed to load categories from API during initialization, will use fallback:', error)
        // Use fallback categories so app can still function
        this.categories = {
          [TRANSACTION_TYPES.INCOME]: ['Lương', 'Thưởng', 'Khác'],
          [TRANSACTION_TYPES.EXPENSE]: ['Ăn Uống', 'Mua Sắm', 'Di Chuyển', 'Khác'],
          [TRANSACTION_TYPES.INVESTMENT]: ['Chứng Khoán', 'Tiết Kiệm', 'Khác'],
          [TRANSACTION_TYPES.WITHDRAW_INVESTMENT]: ['Chứng Khoán', 'Tiết Kiệm', 'Khác']
        }
        this.notifyListeners()
      }
    }
  }

  async loadFromAPI() {
    if (this.isLoading) return
    
    this.isLoading = true
    try {
      const categories = await fetchCategories()
      this.categories = categories
      
      // Save to IndexedDB
      await indexedDBService.saveCategories(categories)
      
      this.notifyListeners()
      return categories
    } catch (error) {
      console.error('Error loading categories from API:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  getCategories() {
    return this.categories || {
      [TRANSACTION_TYPES.INCOME]: [],
      [TRANSACTION_TYPES.EXPENSE]: [],
      [TRANSACTION_TYPES.INVESTMENT]: [],
      [TRANSACTION_TYPES.WITHDRAW_INVESTMENT]: []
    }
  }

  getCategoriesByType(type) {
    return this.getCategories()[type] || []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.categories))
  }
}

export const categoriesManager = new CategoriesManager()