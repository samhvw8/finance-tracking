import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import RootLayout from './layouts/RootLayout'
import TransactionsPage from './pages/TransactionsPage'
import InvestmentsPage from './pages/InvestmentsPage'

// Root route
const rootRoute = createRootRoute({
  component: RootLayout
})

// Transactions route
const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TransactionsPage
})

// Investments route
const investmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/investments',
  component: InvestmentsPage
})

// Route tree
const routeTree = rootRoute.addChildren([
  transactionsRoute,
  investmentsRoute
])

// Create router
export const router = createRouter({ routeTree })
