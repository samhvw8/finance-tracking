const LoadingSkeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Đang tải">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 space-y-5">
        {/* Date field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Type field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Category field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Name field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Amount field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Note field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
      </div>
      <span className="sr-only">Đang tải form giao dịch...</span>
    </div>
  )
}

export default LoadingSkeleton