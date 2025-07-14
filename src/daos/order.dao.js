import { BaseDao } from './base.dao.js'
import { OrderModel } from '../models/order.model.js'

/**
 * Order DAO
 * Handles all data access operations for orders
 */
export class OrderDao extends BaseDao {
  constructor() {
    super(OrderModel)
  }

  /**
   * Get all orders for a specific user
   * @param {string} userId - The ID of the user
   * @param {Object} options - Query options like sort, limit, etc.
   * @returns {Promise<Array>} - Array of user orders
   */
  async getByUserId(userId, options = {}) {
    return this.model.find({ user: userId }, null, options)
      .sort({ createdAt: -1 })
  }

  /**
   * Get orders filtered by status
   * @param {string} status - The status to filter by
   * @param {Object} options - Query options like sort, limit, etc.
   * @returns {Promise<Array>} - Array of orders with the given status
   */
  async getByStatus(status, options = {}) {
    return this.model.find({ status }, null, options)
      .populate('user', 'first_name last_name email')
      .sort({ createdAt: -1 })
  }

  /**
   * Update order status
   * @param {string} orderId - The ID of the order
   * @param {string} status - The new status value
   * @returns {Promise<Object>} - Updated order object
   */
  async updateStatus(orderId, status) {
    const order = await this.model.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Save previous status before updating
    const previousStatus = order.status
    
    // Update with new status
    order.previousStatus = previousStatus
    order.status = status
    
    return order.save()
  }

  /**
   * Generate a unique order code
   * @returns {Promise<string>} - A unique order code
   */
  async generateUniqueCode() {
    // Current timestamp + random number for uniqueness
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    const orderCode = `ORDER-${timestamp}-${randomStr}`
    
    // Check if the code is already in use
    const existingOrder = await this.model.findOne({ code: orderCode })
    if (existingOrder) {
      // Try again if code already exists (very unlikely)
      return this.generateUniqueCode()
    }
    
    return orderCode
  }

  /**
   * Create an order from cart items
   * @param {Object} orderData - Order data including user and products
   * @returns {Promise<Object>} - Created order
   */
  async createFromCart(orderData) {
    // Generate a unique order code
    const code = await this.generateUniqueCode()
    
    // Create the order
    return this.create({
      ...orderData,
      code,
      status: 'pending'
    })
  }
}
