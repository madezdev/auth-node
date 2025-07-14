import logger from '../config/logger.config.js'

/**
 * Middleware to authorize access based on user roles
 * @param {Array} allowedRoles - Array of roles that are allowed to access the resource
 * @returns {Function} - Express middleware function
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in the request (should be set by authentication middleware)
      if (!req.user) {
        logger.warn('Authorization failed: No user in request')
        return res.status(401).json({
          status: 'error',
          message: 'You must be logged in to perform this action'
        })
      }

      // Check if user role is included in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Authorization failed: User ${req.user.email} with role ${req.user.role} attempted to access resource requiring roles: ${allowedRoles.join(', ')}`)
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action'
        })
      }

      // User is authorized
      logger.info(`User ${req.user.email} with role ${req.user.role} authorized for resource requiring roles: ${allowedRoles.join(', ')}`)
      next()
    } catch (error) {
      logger.error(`Role authorization error: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during authorization'
      })
    }
  }
}

/**
 * Middleware to ensure a user can only access their own cart
 * @returns {Function} - Express middleware function
 */
export const cartOwnershipMiddleware = () => {
  return (req, res, next) => {
    try {
      // Get cart ID from request parameters - ensure we're using the correct parameter
      // Routes can use either 'id' or 'cartId' param
      const cartId = req.params.id || req.params.cartId

      if (!cartId) {
        logger.warn('Cart authorization failed: No cart ID in request parameters')
        return res.status(400).json({
          status: 'error',
          message: 'Cart ID is required'
        })
      }

      // Check if user exists in the request
      if (!req.user) {
        logger.warn('Cart authorization failed: No user in request')
        return res.status(401).json({
          status: 'error',
          message: 'You must be logged in to access cart'
        })
      }

      // Admin users can bypass this check
      if (req.user.role === 'admin') {
        logger.info(`Admin user ${req.user.email} authorized to access cart ${cartId}`)
        next()
        return
      }

      // Si el usuario no tiene un carrito asociado aún, no permitimos acceder a un carrito específico
      if (!req.user.cart) {
        logger.warn(`User ${req.user.email} attempted to access cart ${cartId} but has no cart assigned`)
        return res.status(403).json({
          status: 'error',
          message: 'You do not have a cart assigned'
        })
      }

      // Check if cart belongs to user
      if (req.user.cart.toString() === cartId) {
        logger.info(`User ${req.user.email} authorized to access own cart ${cartId}`)
        next()
      } else {
        logger.warn(`Cart authorization failed: User ${req.user.email} attempted to access cart ${cartId} but owns cart ${req.user.cart}`)
        return res.status(403).json({
          status: 'error',
          message: 'You can only access your own cart'
        })
      }
    } catch (error) {
      logger.error(`Cart authorization error: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during cart authorization'
      })
    }
  }
}
