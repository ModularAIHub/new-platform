import { forwardRef } from 'react'
import { getComponentVariant, getComponentSize } from '../../theme'

/**
 * Select component with consistent styling
 * 
 * @param {Object} props - Select props
 * @param {string} props.variant - Select variant: 'default', 'error', 'success'
 * @param {string} props.size - Select size: 'sm', 'md', 'lg'
 * @param {string} props.label - Select label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.required - Required field indicator
 * @param {Array} props.options - Array of option objects with value and label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
const Select = forwardRef(({
  variant = 'default',
  size = 'md',
  label,
  error,
  helperText,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  id,
  ...props
}, ref) => {
  // Determine variant based on error state
  const selectVariant = error ? 'error' : variant
  
  // Get variant and size classes from theme
  const variantClasses = getComponentVariant('input', selectVariant)
  const sizeClasses = getComponentSize('input', size)
  
  // Generate unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  
  // Base select classes
  const baseClasses = 'input-base'
  
  // Combine all classes
  const selectClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Select Field */}
      <select
        ref={ref}
        id={selectId}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Helper Text / Error Message */}
      {(error || helperText) && (
        <div className="text-sm">
          {error && (
            <p className="text-error-600">{error}</p>
          )}
          {!error && helperText && (
            <p className="text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select