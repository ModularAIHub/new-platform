import React, { forwardRef } from 'react'
import { getComponentVariant, getComponentSize } from '../../theme'

// Error icon
const ErrorIcon = () => (
  <svg className="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

// Success icon
const SuccessIcon = () => (
  <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

/**
 * Enhanced Input component with validation styling and states
 * 
 * @param {Object} props - Input props
 * @param {string} props.variant - Input variant: 'default', 'error', 'success'
 * @param {string} props.size - Input size: 'sm', 'md', 'lg'
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.success - Success message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.required - Required field indicator
 * @param {React.ReactNode} props.leftIcon - Icon on the left side
 * @param {React.ReactNode} props.rightIcon - Icon on the right side
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  variant = 'default',
  size = 'md',
  label,
  error,
  success,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  // Determine variant based on error/success state
  const inputVariant = error ? 'error' : success ? 'success' : variant
  
  // Get variant and size classes from theme
  const variantClasses = getComponentVariant('input', inputVariant)
  const sizeClasses = getComponentSize('input', size)
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  // Base input classes
  const baseClasses = 'input-base'
  
  // Combine all classes
  const inputClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    leftIcon ? 'pl-10' : '',
    rightIcon || error || success ? 'pr-10' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {/* Right Icon / Status Icon */}
        <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${(error || success) ? 'pointer-events-none' : ''}`}>
          {error && <ErrorIcon />}
          {!error && success && <SuccessIcon />}
          {!error && !success && rightIcon && rightIcon}
        </div>
      </div>
      
      {/* Helper Text / Error / Success Message */}
      {(error || success || helperText) && (
        <div className="text-sm">
          {error && (
            <p className="text-error-600 flex items-center space-x-1">
              <ErrorIcon />
              <span>{error}</span>
            </p>
          )}
          {!error && success && (
            <p className="text-success-600 flex items-center space-x-1">
              <SuccessIcon />
              <span>{success}</span>
            </p>
          )}
          {!error && !success && helperText && (
            <p className="text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input