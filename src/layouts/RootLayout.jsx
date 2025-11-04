import React from 'react'
import { Outlet } from '@tanstack/react-router'
import Sidebar from '../components/Sidebar'

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="container mx-auto px-4 py-6 sm:py-12 max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RootLayout
