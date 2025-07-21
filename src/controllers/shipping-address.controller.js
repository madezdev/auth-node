import { shippingAddressRepository } from '../repositories/shipping-address.repository.js'
import { createShippingAddressDTO, createShippingAddressesDTO, fromShippingAddressDTO } from '../dtos/shipping-address.dto.js'
import { UserRoleService } from '../services/user-role.service.js'
import logger from '../config/logger.config.js'

/**
 * ShippingAddress Controller
 * Handles operations related to shipping addresses
 */
export class ShippingAddressController {
  constructor () {
    this.repository = shippingAddressRepository
  }

  /**
   * Get all shipping addresses for the current user
   */
  async getUserAddresses (req, res) {
    try {
      const userId = req.user.id
      logger.info(`Fetching addresses for user: ${userId}`)

      const addresses = await this.repository.getUserAddresses(userId)
      return res.status(200).json({
        status: 'success',
        payload: createShippingAddressesDTO(addresses)
      })
    } catch (error) {
      logger.error(`Error fetching addresses: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener las direcciones de envío'
      })
    }
  }

  /**
   * Get default shipping address for the current user
   */
  async getDefaultAddress (req, res) {
    try {
      const userId = req.user.id
      logger.info(`Fetching default address for user: ${userId}`)

      const address = await this.repository.getUserDefaultAddress(userId)
      return res.status(200).json({
        status: 'success',
        payload: createShippingAddressDTO(address)
      })
    } catch (error) {
      logger.error(`Error fetching default address: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener la dirección de envío predeterminada'
      })
    }
  }

  /**
   * Create a new shipping address for the current user
   */
  async createAddress (req, res) {
    try {
      const userId = req.user.id
      logger.info(`Creating new address for user: ${userId}`)

      // Validar campos requeridos
      const { state, street, postalCode, country, locality } = req.body
      
      if (!state || !street || !postalCode || !country || !locality) {
        return res.status(400).json({
          status: 'error',
          message: 'Faltan campos requeridos para la dirección de envío'
        })
      }

      // Convertir datos del frontend al formato de la base de datos
      const addressData = fromShippingAddressDTO(req.body)

      // Crear la dirección
      const newAddress = await this.repository.createAddress(addressData, userId)
      
      // Verificar si debe ser promovido de 'guest' a 'user'
      await UserRoleService.updateRoleBasedOnCompletion(userId)
      
      return res.status(201).json({
        status: 'success',
        payload: createShippingAddressDTO(newAddress)
      })
    } catch (error) {
      logger.error(`Error creating address: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear la dirección de envío'
      })
    }
  }

  /**
   * Update an existing shipping address
   */
  async updateAddress (req, res) {
    try {
      const { addressId } = req.params
      const userId = req.user.id
      
      logger.info(`Updating address ${addressId} for user: ${userId}`)

      // Validar campos mínimos
      const { state, street, postalCode, country, locality } = req.body
      
      if (!state || !street || !postalCode || !country || !locality) {
        return res.status(400).json({
          status: 'error',
          message: 'Faltan campos requeridos para la dirección de envío'
        })
      }

      // Convertir datos del frontend al formato de la base de datos
      const addressData = fromShippingAddressDTO(req.body)

      // Actualizar la dirección
      const updatedAddress = await this.repository.updateAddress(addressId, addressData, userId)
      
      // Verificar si debe ser promovido de 'guest' a 'user'
      await UserRoleService.updateRoleBasedOnCompletion(userId)

      if (!updatedAddress) {
        return res.status(404).json({
          status: 'error',
          message: 'Dirección no encontrada'
        })
      }
      
      return res.status(200).json({
        status: 'success',
        payload: createShippingAddressDTO(updatedAddress)
      })
    } catch (error) {
      logger.error(`Error updating address: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar la dirección de envío'
      })
    }
  }

  /**
   * Delete a shipping address
   */
  async deleteAddress (req, res) {
    try {
      const { addressId } = req.params
      const userId = req.user.id
      
      logger.info(`Deleting address ${addressId} for user: ${userId}`)

      await this.repository.deleteAddress(addressId, userId)
      
      return res.status(200).json({
        status: 'success',
        message: 'Dirección eliminada correctamente'
      })
    } catch (error) {
      logger.error(`Error deleting address: ${error.message}`, { stack: error.stack })

      if (error.message === 'Address not found') {
        return res.status(404).json({
          status: 'error',
          message: 'Dirección no encontrada'
        })
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar la dirección de envío'
      })
    }
  }

  /**
   * Set an address as the default shipping address
   */
  async setDefaultAddress (req, res) {
    try {
      const { addressId } = req.params
      const userId = req.user.id
      
      logger.info(`Setting address ${addressId} as default for user: ${userId}`)

      await this.repository.setDefaultAddress(addressId, userId)
      
      return res.status(200).json({
        status: 'success',
        message: 'Dirección predeterminada actualizada'
      })
    } catch (error) {
      logger.error(`Error setting default address: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Error al establecer la dirección predeterminada'
      })
    }
  }
}

// Export a singleton instance
export const shippingAddressController = new ShippingAddressController()
