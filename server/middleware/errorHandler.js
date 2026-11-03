const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        status: err.status || 500,
        code: err.code || 'INTERNAL_ERROR'
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error = {
            message: 'Validation Error',
            status: 400,
            code: 'VALIDATION_ERROR',
            details: err.details
        };
    }

    if (err.name === 'UnauthorizedError') {
        error = {
            message: 'Unauthorized',
            status: 401,
            code: 'UNAUTHORIZED'
        };
    }

    if (err.code === '23505') { // PostgreSQL unique constraint violation
        error = {
            message: 'Resource already exists',
            status: 409,
            code: 'DUPLICATE_ENTRY'
        };
    }

    if (err.code === '23503') { // PostgreSQL foreign key constraint violation
        error = {
            message: 'Referenced resource not found',
            status: 400,
            code: 'FOREIGN_KEY_VIOLATION'
        };
    }

    if (err.appCode === 'DATABASE_UNAVAILABLE') {
        error = {
            message: 'Database temporarily unavailable. Please try again.',
            status: 503,
            code: 'DATABASE_UNAVAILABLE'
        };
    }

    // Send error response
    res.status(error.status).json({
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export { errorHandler };
