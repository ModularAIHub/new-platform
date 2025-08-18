import React from 'react'

const Loader = ({ size = 32, className = '' }) => {
    const dimension = typeof size === 'number' ? `${size}px` : size
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className="animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
                style={{ width: dimension, height: dimension }}
            />
        </div>
    )
}

export default Loader



