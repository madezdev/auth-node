import { userRepository } from '../repositories/user.repository.js';
import logger from '../config/logger.config.js';

/**
 * Role-based authorization middleware
 * Restricts access to routes based on user roles
 * 
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
export const roleAuthorization = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        logger.warn('Authorization failed: User not authenticated');
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized: Authentication required'
        });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Role authorization failed: User ${req.user.email} with role ${req.user.role} attempted to access a resource requiring ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Insufficient permissions'
        });
      }

      logger.info(`Authorization successful: User ${req.user.email} with role ${req.user.role}`);
      next();
    } catch (error) {
      logger.error(`Error in role authorization middleware: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Ownership middleware for carts
 * Ensures users can only access their own cart unless they are admins
 * 
 * @returns {Function} Express middleware function
 */
export const cartOwnershipMiddleware = () => {
  return async (req, res, next) => {
    try {
      // Get the cart ID from params
      const cartId = req.params.id; // Use req.params.id, not req.params.cartId

      if (!cartId) {
        logger.warn('Cart authorization failed: No cart ID provided');
        return res.status(400).json({
          status: 'error',
          message: 'Bad request: Cart ID required'
        });
      }

      // Allow admin access to any cart
      if (req.user.role === 'admin') {
        logger.info(`Admin user ${req.user.email} granted access to cart ${cartId}`);
        return next();
      }

      // Get user with cart information
      const user = await userRepository.getUserById(req.user._id);

      // Handle cases where user has no cart assigned
      if (!user || !user.cart) {
        logger.warn(`User ${req.user.email} attempted to access cart ${cartId} but has no assigned cart`);
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to access this cart'
        });
      }

      // Check if user owns the cart
      if (user.cart.toString() !== cartId) {
        logger.warn(`User ${req.user.email} attempted to access cart ${cartId} but owns cart ${user.cart}`);
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only access your own cart'
        });
      }

      logger.info(`User ${req.user.email} granted access to their cart ${cartId}`);
      next();
    } catch (error) {
      logger.error(`Error in cart ownership middleware: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during cart authorization'
      });
    }
  };
};

/**
 * Ownership middleware for user resources
 * Ensures users can only access their own resources unless they are admins
 * 
 * @returns {Function} Express middleware function
 */
export const userOwnershipMiddleware = () => {
  return (req, res, next) => {
    try {
      // Get the user ID from params
      const userId = req.params.id;

      if (!userId) {
        logger.warn('User authorization failed: No user ID provided');
        return res.status(400).json({
          status: 'error',
          message: 'Bad request: User ID required'
        });
      }

      // Allow admin access to any user
      if (req.user.role === 'admin') {
        logger.info(`Admin user ${req.user.email} granted access to user ${userId}`);
        return next();
      }

      // Check if user is accessing their own resource
      if (req.user._id.toString() !== userId) {
        logger.warn(`User ${req.user.email} attempted to access another user's resource ${userId}`);
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You can only access your own profile'
        });
      }

      logger.info(`User ${req.user.email} granted access to their own profile`);
      next();
    } catch (error) {
      logger.error(`Error in user ownership middleware: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during user authorization'
      });
    }
  };
};

/**
 * Middleware for product operations
 * Restricts product creation, update, and deletion to admin users
 * 
 * @returns {Function} Express middleware function
 */
export const productAdminMiddleware = () => {
  return (req, res, next) => {
    try {
      // Check if user is an admin
      if (req.user.role !== 'admin') {
        logger.warn(`User ${req.user.email} with role ${req.user.role} attempted to modify products`);
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Only administrators can modify products'
        });
      }

      logger.info(`Admin user ${req.user.email} granted access to modify products`);
      next();
    } catch (error) {
      logger.error(`Error in product admin middleware: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during product authorization'
      });
    }
  };
};
