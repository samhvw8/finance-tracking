import { indexedDBService } from './indexedDB'
import { fetchInvestmentAccounts } from './sheetdb'

class InvestmentAccountsManager {
  constructor() {
    this.accounts = []
    this.isInitialized = false
  }

  async initialize() {
    try {
      // Try to load from IndexedDB first
      const cachedAccounts = await indexedDBService.getInvestmentAccounts()

      if (cachedAccounts && cachedAccounts.length > 0) {
        this.accounts = cachedAccounts
        this.isInitialized = true
        console.log('Loaded investment accounts from cache:', this.accounts)

        // Fetch fresh data in background
        this.refreshInBackground()
      } else {
        // No cache, fetch from API
        await this.refresh()
      }
    } catch (error) {
      console.error('Error initializing investment accounts manager:', error)
      // Set default account if all else fails
      this.accounts = [{ id: 'INV001', name: 'INV001', type: 'Default' }]
      this.isInitialized = true
    }
  }

  async refresh() {
    try {
      console.log('Fetching fresh investment accounts from API...')
      const accounts = await fetchInvestmentAccounts()

      if (accounts && accounts.length > 0) {
        this.accounts = accounts
        await indexedDBService.saveInvestmentAccounts(accounts)
        console.log('Investment accounts refreshed:', accounts)
      } else {
        // If no accounts returned, use default
        this.accounts = [{ id: 'INV001', name: 'INV001', type: 'Default' }]
      }

      this.isInitialized = true
      return this.accounts
    } catch (error) {
      console.error('Error refreshing investment accounts:', error)

      // Try to use cached data if refresh fails
      const cachedAccounts = await indexedDBService.getInvestmentAccounts()
      if (cachedAccounts && cachedAccounts.length > 0) {
        this.accounts = cachedAccounts
      } else {
        // Use default as last resort
        this.accounts = [{ id: 'INV001', name: 'INV001', type: 'Default' }]
      }

      throw error
    }
  }

  async refreshInBackground() {
    try {
      await this.refresh()
    } catch (error) {
      console.error('Background refresh failed:', error)
    }
  }

  getAccounts() {
    return this.accounts
  }

  getAccountById(id) {
    return this.accounts.find(account => account.id === id)
  }

  getAccountIds() {
    return this.accounts.map(account => account.id)
  }
}

export const investmentAccountsManager = new InvestmentAccountsManager()
