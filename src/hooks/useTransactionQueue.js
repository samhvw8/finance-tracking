/**
 * Custom hook for managing transaction queue in batch mode
 * Handles IndexedDB persistence and queue operations
 */

import { useState, useEffect, useCallback } from 'react'
import { indexedDBService } from '../services/indexedDB'

/**
 * Hook for managing queued transactions with auto-save
 * @param {boolean} enabled - Whether queue management is active
 * @returns {Object} Queue state and operations
 */
export const useTransactionQueue = (enabled = false) => {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Load saved transactions from IndexedDB on mount
   */
  useEffect(() => {
    if (enabled) {
      loadSavedTransactions()
    }
  }, [enabled])

  /**
   * Auto-save transactions whenever queue changes
   */
  useEffect(() => {
    if (enabled && transactions.length >= 0) {
      saveToStorage()
    }
  }, [transactions, enabled])

  /**
   * Load transactions from IndexedDB
   */
  const loadSavedTransactions = async () => {
    try {
      setIsLoading(true)
      const savedTransactions = await indexedDBService.getQueuedInvestmentTransactions()

      if (savedTransactions?.length > 0) {
        const restored = savedTransactions.map(t => ({
          ...t,
          date: new Date(t.date)
        }))
        setTransactions(restored)
        return restored.length
      }
      return 0
    } catch (error) {
      console.error('Error loading saved transactions:', error)
      return 0
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Save current queue to IndexedDB
   */
  const saveToStorage = async () => {
    if (!enabled) return

    try {
      await indexedDBService.clearInvestmentQueue()

      for (const transaction of transactions) {
        await indexedDBService.addToInvestmentQueue({
          ...transaction,
          date: transaction.date.toISOString()
        })
      }
    } catch (error) {
      console.error('Error saving transactions to storage:', error)
    }
  }

  /**
   * Add transaction to queue
   * @param {Object} transaction - Transaction data
   */
  const addToQueue = useCallback((transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now()
    }
    setTransactions(prev => [...prev, newTransaction])
    return newTransaction.id
  }, [])

  /**
   * Remove transaction from queue by ID
   * @param {number} id - Transaction ID
   */
  const removeFromQueue = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  /**
   * Clear all transactions from queue
   */
  const clearQueue = useCallback(async () => {
    setTransactions([])
    try {
      await indexedDBService.clearInvestmentQueue()
    } catch (error) {
      console.error('Error clearing saved transactions:', error)
    }
  }, [])

  /**
   * Get queue count
   */
  const count = transactions.length

  /**
   * Check if queue has transactions
   */
  const hasTransactions = count > 0

  return {
    transactions,
    count,
    hasTransactions,
    isLoading,
    addToQueue,
    removeFromQueue,
    clearQueue,
    loadSavedTransactions
  }
}
