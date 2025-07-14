import logger from '../config/logger.config.js'

/**
 * Middleware to ensure only admins can create products
 * This middleware should be used after authenticateToken
 */
export const adminProductCreation = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Admin validation failed: No authenticated user')
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      // Only admins can create products
      if (req.user.role !== 'admin') {
        logger.warn(`Unauthorized product creation attempt by user: ${req.user.email} with role: ${req.user.role}`)
        return res.status(403).json({
          status: 'error',
          message: 'Only administrators can create new products'
        })
      }

      logger.info(`Admin ${req.user.email} authorized for product creation`)
      next()
    } catch (error) {
      logger.error(`Error in admin product creation middleware: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during authorization'
      })
    }
  }
}

/**
 * Middleware to ensure only admins can update products
 * This middleware should be used after authenticateToken
 */
export const adminProductUpdate = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Admin validation failed: No authenticated user')
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      // Only admins can update products
      if (req.user.role !== 'admin') {
        logger.warn(`Unauthorized product update attempt by user: ${req.user.email} with role: ${req.user.role}`)
        return res.status(403).json({
          status: 'error',
          message: 'Only administrators can update products'
        })
      }

      logger.info(`Admin ${req.user.email} authorized for product update`)
      next()
    } catch (error) {
      logger.error(`Error in admin product update middleware: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during authorization'
      })
    }
  }
}

/**
 * Middleware to ensure only admins can delete products
 * This middleware should be used after authenticateToken
 */
export const adminProductDeletion = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Admin validation failed: No authenticated user')
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      // Only admins can delete products
      if (req.user.role !== 'admin') {
        logger.warn(`Unauthorized product deletion attempt by user: ${req.user.email} with role: ${req.user.role}`)
        return res.status(403).json({
          status: 'error',
          message: 'Only administrators can delete products'
        })
      }

      logger.info(`Admin ${req.user.email} authorized for product deletion`)
      next()
    } catch (error) {
      logger.error(`Error in admin product deletion middleware: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during authorization'
      })
    }
  }
}
