import { shippingAddressDao } from '../daos/shipping-address.dao.js'
import logger from '../config/logger.config.js'
import { UserModel } from '../models/user.model.js'

/**
 * ShippingAddress Repository
 * Handles business logic for shipping addresses and user relationships
 */
export class ShippingAddressRepository {
  constructor () {
    this.dao = shippingAddressDao
  }

  /**
   * Get all addresses for a user
   * @param {string} userId - User ID
   */
  async getUserAddresses (userId) {
    return this.dao.getByUserId(userId)
  }

  /**
   * Get user's default address
   * @param {string} userId - User ID
   */
  async getUserDefaultAddress (userId) {
    return this.dao.getDefaultByUserId(userId)
  }

  /**
   * Create a new shipping address for user
   * @param {Object} addressData - Address data
   * @param {string} userId - User ID
   */
  async createAddress (addressData, userId) {
    try {
      // Create the address
      const newAddress = await this.dao.create({
        ...addressData,
        user: userId
      })

      // Update user's shipping_addresses array
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $addToSet: { shipping_addresses: newAddress._id }
        }
      )

      // If this is the first address or is marked as default, set it as the default address
      const isDefault = addressData.is_default !== false // default to true if not specified
      
      if (isDefault) {
        await this.setDefaultAddress(newAddress._id, userId)
      }

      return newAddress
    } catch (error) {
      logger.error(`Error creating shipping address: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Update an existing shipping address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address data
   * @param {string} userId - User ID
   */
  async updateAddress (addressId, addressData, userId) {
    try {
      // Update the address
      const updatedAddress = await this.dao.update(addressId, addressData)
      
      // If marked as default, update user's default address
      if (addressData.is_default) {
        await this.setDefaultAddress(addressId, userId)
      }
      
      return updatedAddress
    } catch (error) {
      logger.error(`Error updating shipping address: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Delete a shipping address
   * @param {string} addressId - Address ID
   * @param {string} userId - User ID
   */
  async deleteAddress (addressId, userId) {
    try {
      // Find the address first to check if it's a default
      const address = await this.dao.getById(addressId)
      
      if (!address) {
        throw new Error('Address not found')
      }
      
      // Delete the address
      await this.dao.delete(addressId)
      
      // Remove reference from user
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { shipping_addresses: addressId }
        }
      )
      
      // If it was the default address, find another to make default
      if (address.is_default) {
        // Find another address
        const otherAddress = await this.dao.getOne({ user: userId })
        
        if (otherAddress) {
          // Make another address the default
          await this.setDefaultAddress(otherAddress._id, userId)
        } else {
          // No more addresses, remove default
          await UserModel.findByIdAndUpdate(
            userId,
            { default_shipping_address: null }
          )
        }
      }
      
      return { success: true }
    } catch (error) {
      logger.error(`Error deleting shipping address: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Set an address as the user's default address
   * @param {string} addressId - Address ID
   * @param {string} userId - User ID
   */
  async setDefaultAddress (addressId, userId) {
    try {
      // Set the address as default in the address collection
      await this.dao.setAsDefault(addressId, userId)
      
      // Update user's default_shipping_address field
      await UserModel.findByIdAndUpdate(
        userId,
        { default_shipping_address: addressId }
      )
      
      return { success: true }
    } catch (error) {
      logger.error(`Error setting default address: ${error.message}`, { stack: error.stack })
      throw error
    }
  }
}

// Export a singleton instance
export const shippingAddressRepository = new ShippingAddressRepository()
