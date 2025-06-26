import logger from '../config/logger.config.js'

/**
 * Central error handling middleware
 * Prevents leaking stack traces to client in production
 */
export const errorHandler = (err, req, res, next) => {
  // Log error with detailed information
  logger.error(`Error: ${err.message}`, {
    statusCode: err.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  })

  // Set appropriate status code
  const statusCode = err.statusCode || 500

  // Production error response - hide stack trace
  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({
      status: 'error',
      message: err.message || 'Internal Server Error'
    })
  }

  // Development error response - include stack trace
  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: err.stack,
    error: err
  })
}

/**
 * Handle 404 errors for routes not found
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  error.statusCode = 404

  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  })

  next(error)
}
