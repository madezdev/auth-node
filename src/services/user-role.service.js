import logger from '../config/logger.config.js'
import { UserModel } from '../models/user.model.js'

/**
 * UserRoleService
 *
 * Servicio para gestionar la promoción automática de roles de usuario
 * basado en la completitud de su información personal y direcciones
 */
export class UserRoleService {
  /**
   * Verifica si un usuario tiene su información personal completa
   * @param {Object} user - Documento de usuario
   * @returns {Boolean} - true si está completo, false si falta información
   */
  static isUserInfoCompleted (user) {
    return !!(
      user &&
      user.first_name &&
      user.last_name &&
      user.birthday &&
      user.identifier &&
      user.tax_identifier &&
      user.email &&
      user.phone
    )
  }

  /**
   * Verifica si un usuario tiene al menos una dirección de envío
   * @param {Object} user - Documento de usuario
   * @returns {Boolean} - true si tiene al menos una dirección, false si no
   */
  static hasShippingAddress (user) {
    return !!(
      user &&
      user.shipping_addresses &&
      user.shipping_addresses.length > 0 &&
      user.default_shipping_address
    )
  }

  /**
   * Actualiza el rol de usuario basado en la completitud de su información
   * Promociona de 'guest' a 'user' cuando la información está completa
   * @param {String} userId - ID del usuario a verificar
   * @returns {Object} - Usuario actualizado o null si no fue necesario
   */
  static async updateRoleBasedOnCompletion (userId) {
    try {
      // Obtener el usuario con sus direcciones de envío
      const user = await UserModel.findById(userId).populate('shipping_addresses')

      if (!user) {
        logger.warn(`No se encontró usuario con ID ${userId} para actualizar rol`)
        return null
      }
      
      // Solo aplicar a usuarios con rol 'guest'
      if (user.role !== 'guest') {
        return user
      }

      // Verificar si cumple las condiciones para promoción
      const userIsCompleted = this.isUserInfoCompleted(user)
      const addressIsCompleted = this.hasShippingAddress(user)

      // Si ambas condiciones se cumplen, promover a 'user'
      if (userIsCompleted && addressIsCompleted) {
        user.role = 'user'
        await user.save()
        logger.info(`Usuario ${userId} promovido de 'guest' a 'user' por completar su información`)
        return user
      }
      
      return user
    } catch (error) {
      logger.error(`Error al actualizar rol de usuario: ${error.message}`, { stack: error.stack })
      throw error
    }
  }
}

export const userRoleService = new UserRoleService()
