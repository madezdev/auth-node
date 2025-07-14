import logger from '../config/logger.config.js'

/**
 * Middleware to ensure only users with complete profiles can add products to cart
 * Guests with incomplete profiles should be required to complete their information
 */
export const completeProfileRequired = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Authentication required for cart operations')
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        })
      }

      // Check if user's role is 'guest', which means incomplete profile
      if (req.user.role === 'guest') {
        logger.warn(`User ${req.user.email} attempted cart operation with incomplete profile`)
        return res.status(403).json({
          status: 'error',
          message: 'Please complete your profile before using the cart',
          code: 'INCOMPLETE_PROFILE'
        })
      }

      logger.info(`User ${req.user.email} with role ${req.user.role} authorized for cart operation`)
      next()
    } catch (error) {
      logger.error(`Error in cart profile middleware: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during authorization'
      })
    }
  }
}
