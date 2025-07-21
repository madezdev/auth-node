import { ShippingAddressDao } from '../daos/shipping-address.dao.js'
import logger from '../config/logger.config.js'

/**
 * Middleware de verificación de propiedad de direcciones de envío
 *
 * Este middleware factory genera un middleware que verifica que el usuario actual
 * sea propietario de la dirección de envío o tenga rol de administrador
 *
 * @returns {Function} Middleware Express
 */
export const shippingAddressOwnershipMiddleware = () => {
  const addressDao = new ShippingAddressDao()

  return async (req, res, next) => {
    try {
      // Si el usuario es admin, permitir acceso sin restricciones
      if (req.user?.role === 'admin') {
        return next()
      }

      const userId = req.user?.id
      const addressId = req.params.id || req.params.addressId

      if (!userId) {
        logger.warn('Intento de acceso a dirección de envío sin autenticación')
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - Authentication required'
        })
      }

      if (!addressId) {
        logger.warn('Intento de acceso a dirección sin especificar ID')
        return res.status(400).json({
          status: 'error',
          message: 'Address ID is required'
        })
      }

      // Obtener la dirección
      const address = await addressDao.getById(addressId)

      // Verificar que la dirección exista
      if (!address) {
        logger.warn(`Dirección de envío ${addressId} no encontrada`)
        return res.status(404).json({
          status: 'error',
          message: 'Shipping address not found'
        })
      }

      // Verificar la propiedad
      if (address.user.toString() !== userId) {
        logger.warn(`Usuario ${userId} intentó acceder a la dirección ${addressId} que no le pertenece`)
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this shipping address'
        })
      }

      // Si todo está correcto, continuar
      next()
    } catch (error) {
      logger.error(`Error en middleware de propiedad de dirección: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Server error verifying address ownership'
      })
    }
  }
}
