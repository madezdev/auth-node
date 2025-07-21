import { BaseDao } from './base.dao.js'
import { ShippingAddressModel } from '../models/shipping-address.model.js'
import logger from '../config/logger.config.js'

/**
 * ShippingAddress DAO
 * Handles all data access operations for shipping addresses
 */
export class ShippingAddressDao extends BaseDao {
  constructor () {
    super(ShippingAddressModel)
  }

  /**
   * Get all addresses for a specific user
   * @param {string} userId - The ID of the user
   * @returns {Promise<Array>} - Array of addresses
   */
  async getByUserId (userId) {
    try {
      logger.debug(`Fetching addresses for user: ${userId}`)
      return this.model.find({ user: userId }).sort({ is_default: -1, updatedAt: -1 })
    } catch (error) {
      logger.error(`Error fetching addresses for user ${userId}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Get default address for a user
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} - The default address or null
   */
  async getDefaultByUserId (userId) {
    try {
      logger.debug(`Fetching default address for user: ${userId}`)
      return this.model.findOne({ user: userId, is_default: true })
    } catch (error) {
      logger.error(`Error fetching default address for user ${userId}: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Set an address as default and unset any previous default
   * @param {string} addressId - The ID of the address to set as default
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} - The updated address
   */
  async setAsDefault (addressId, userId) {
    try {
      logger.info(`Setting address ${addressId} as default for user ${userId}`)
      
      // First unset any existing default
      await this.model.updateMany(
        { user: userId, is_default: true },
        { is_default: false }
      )
      
      // Then set new default
      const address = await this.model.findOneAndUpdate(
        { _id: addressId, user: userId },
        { is_default: true },
        { new: true }
      )
      
      return address
    } catch (error) {
      logger.error(`Error setting address as default: ${error.message}`, { stack: error.stack })
      throw error
    }
  }
}

// Export a singleton instance
export const shippingAddressDao = new ShippingAddressDao()
