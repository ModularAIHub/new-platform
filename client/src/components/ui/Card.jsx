import React, { forwardRef } from 'react'
import { getComponentVariant } from '../../theme'

/**
 * Enhanced Card component with elevation levels and hover effects
 * 
 * @param {Object} props - Card props
 * @param {string} props.variant - Card variant: 'default', 'elevated', 'interactive'
 * @param {string} props.padding - Card padding: 'sm', 'md', 'lg'
 * @param {boolean} props.hover - Enable hover effects
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 * @param {function} props.onClick - Click handler (makes card interactive)
 */
const Card = forwardRef(({
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  // Get variant classes from theme
  const variantClasses = getComponentVariant('card', variant)
  
  // Padding classes
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  }
  
  // Base card classes
  const baseClasses = 'card-base'
  
  // Determine if card should be interactive
  const isInteractive = onClick || variant === 'interactive'
  
  // Combine all classes
  const cardClasses = [
    baseClasses,
    variantClasses,
    paddingClasses[padding],
    hover || isInteractive ? 'hover-lift cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ')

  const CardComponent = onClick ? 'button' : 'div'

  return (
    <CardComponent
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardComponent>
  )
})

/**
 * Card Header component
 */
const CardHeader = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`card-header ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * Card Title component
 */
const CardTitle = forwardRef(({
  className = '',
  children,
  as: Component = 'h3',
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      className={`card-title ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

/**
 * Card Description component
 */
const CardDescription = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={`card-description ${className}`}
      {...props}
    >
      {children}
    </p>
  )
})

/**
 * Card Content component
 */
const CardContent = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`card-content ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * Card Footer component
 */
const CardFooter = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`card-footer ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

// Set display names for better debugging
Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'

// Export all components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
}

export default Card