import { useState, useRef, useEffect } from 'react'

const Tooltip = ({ 
  children, 
  content, 
  position = 'top', 
  className = '',
  delay = 300,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef(null)
  const tooltipRef = useRef(null)
  const triggerRef = useRef(null)

  const showTooltip = () => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      checkPosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const checkPosition = () => {
    if (tooltipRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      let newPosition = position

      // Check if tooltip would overflow viewport
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewportHeight - 10) {
        newPosition = 'top'
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right'
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewportWidth - 10) {
        newPosition = 'left'
      }

      setActualPosition(newPosition)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg'
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
    }
  }

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45'
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1`
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1`
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1`
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onTouchStart={showTooltip}
        onTouchEnd={hideTooltip}
        role="button"
        tabIndex={0}
        aria-describedby={isVisible ? 'tooltip' : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className={`${getPositionClasses()} animate-fadeIn`}
          style={{ whiteSpace: 'nowrap', maxWidth: '250px', whiteSpace: 'normal' }}
        >
          {content}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  )
}

export default Tooltip