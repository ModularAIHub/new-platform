import React, { forwardRef } from 'react'
import { getComponentVariant, getComponentSize } from '../../theme'

// Loading spinner component
const LoadingSpinner = ({ size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-6 h-6'
    }

    return (
        <svg
            className={`animate-spin ${sizeClasses[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    )
}

/**
 * Enhanced Button component with multiple variants, sizes, and states
 * 
 * @param {Object} props - Button props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'error'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.iconPosition - Icon position: 'left', 'right'
 * @param {boolean} props.fullWidth - Make button full width
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {function} props.onClick - Click handler
 */
const Button = forwardRef(({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon = null,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    children,
    type = 'button',
    onClick,
    ...props
}, ref) => {
    // Get variant and size classes from theme
    const variantClasses = getComponentVariant('button', variant)
    const sizeClasses = getComponentSize('button', size)

    // Base button classes
    const baseClasses = 'btn-base'

    // Combine all classes
    const buttonClasses = [
        baseClasses,
        variantClasses,
        sizeClasses,
        fullWidth ? 'w-full' : '',
        loading || disabled ? 'cursor-not-allowed' : '',
        className
    ].filter(Boolean).join(' ')

    // Handle click with loading/disabled state
    const handleClick = (e) => {
        if (loading || disabled) {
            e.preventDefault()
            return
        }
        onClick?.(e)
    }

    return (
        <button
            ref={ref}
            type={type}
            className={buttonClasses}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {/* Loading state */}
            {loading && (
                <LoadingSpinner size={size} />
            )}

            {/* Icon on left */}
            {!loading && icon && iconPosition === 'left' && (
                <span className="flex-shrink-0">
                    {icon}
                </span>
            )}

            {/* Button text */}
            {children && (
                <span className={loading ? 'opacity-0' : ''}>
                    {children}
                </span>
            )}

            {/* Icon on right */}
            {!loading && icon && iconPosition === 'right' && (
                <span className="flex-shrink-0">
                    {icon}
                </span>
            )}
        </button>
    )
})

Button.displayName = 'Button'

export default Button