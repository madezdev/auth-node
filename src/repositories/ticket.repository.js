import { BaseRepository } from './base.repository.js'
import { TicketModel } from '../models/ticket.model.js'
import { ProductModel } from '../models/product.model.js'
import { v4 as uuidv4 } from 'uuid'
import logger from '../config/logger.config.js'

/**
 * Repository for Ticket-related database operations
 */
export class TicketRepository extends BaseRepository {
  constructor () {
    super(TicketModel)
  }

  /**
   * Create a new purchase ticket
   * @param {String} purchaserEmail - Email of the user making the purchase
   * @param {Array} availableProducts - Products available for purchase
   * @param {Number} total - Total purchase amount
   * @param {Array} unavailableProducts - Products that were unavailable (optional)
   * @returns {Promise} - Created ticket
   */
  async createTicket (purchaserEmail, availableProducts, total, unavailableProducts = []) {
    try {
      logger.debug(`Creating ticket for ${purchaserEmail} with ${availableProducts.length} products`)

      const ticketData = {
        code: uuidv4(),
        purchaser: purchaserEmail,
        amount: total,
        products: availableProducts,
        status: unavailableProducts.length > 0 ? 'incomplete' : 'complete'
      }

      // Add failed products if any exist
      if (unavailableProducts.length > 0) {
        ticketData.failedProducts = unavailableProducts
        logger.warn(`Ticket for ${purchaserEmail} is incomplete due to ${unavailableProducts.length} unavailable products`)
      }

      const ticket = await this.create(ticketData)
      logger.info(`Ticket ${ticket.code} created successfully for ${purchaserEmail}`)
      return ticket
    } catch (error) {
      logger.error(`Error creating ticket: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Find tickets by purchaser email
   * @param {String} email - Purchaser email
   * @returns {Promise} - Array of tickets
   */
  async findByPurchaser (email) {
    try {
      logger.debug(`Finding tickets for purchaser: ${email}`)
      const tickets = await this.model.find({ purchaser: email }).sort({ purchase_datetime: -1 }).populate('products.product')
      logger.debug(`Found ${tickets.length} tickets for ${email}`)
      return tickets
    } catch (error) {
      logger.error(`Error finding tickets by purchaser: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Find tickets by code
   * @param {String} code - Ticket code
   * @returns {Promise} - Ticket document
   */
  async findByCode (code) {
    try {
      logger.debug(`Finding ticket with code: ${code}`)
      const ticket = await this.model.findOne({ code })
  
      if (!ticket) {
        logger.warn(`Ticket with code ${code} not found`)
      }
  
      return ticket
    } catch (error) {
      logger.error(`Error finding ticket by code: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Get tickets by status
   * @param {String} status - Status to filter by ('complete' or 'incomplete')
   * @returns {Promise} - Array of tickets
   */
  async findByStatus(status) {
    try {
      logger.debug(`Finding tickets with status: ${status}`)
      const tickets = await this.model.find({ status }).sort({ purchase_datetime: -1 })
      logger.debug(`Found ${tickets.length} tickets with status ${status}`)
      return tickets
    } catch (error) {
      logger.error(`Error finding tickets by status: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

  /**
   * Check stock availability for products in cart
   * @param {Array} cartProducts - Products in cart with quantities
   * @returns {Promise} - Object with available and unavailable products
   */
  async checkProductsAvailability (cartProducts) {
    try {
      logger.debug(`Checking availability for ${cartProducts.length} products`)
      const availableProducts = []
      const unavailableProducts = []
      let total = 0
  
      for (const item of cartProducts) {
        const product = await ProductModel.findById(item.product)
    
        if (!product) {
          logger.warn(`Product ${item.product} not found during availability check`)
          unavailableProducts.push({
            product: item.product,
            quantity: item.quantity,
            available: 0
          })
          continue
        }
    
        if (product.stock >= item.quantity) {
          // Product is available with sufficient stock
          availableProducts.push({
            product: item.product,
            quantity: item.quantity,
            price: product.price
          })
          total += product.price * item.quantity
        } else {
          // Product has insufficient stock
          logger.warn(`Insufficient stock for product ${product._id} (${product.name}): requested ${item.quantity}, available ${product.stock}`)
          unavailableProducts.push({
            product: item.product,
            quantity: item.quantity,
            available: product.stock
          })
        }
      }
  
      logger.debug(`Availability check complete: ${availableProducts.length} available, ${unavailableProducts.length} unavailable`)
      return { availableProducts, unavailableProducts, total }
    } catch (error) {
      logger.error(`Error checking product availability: ${error.message}`, { stack: error.stack })
      throw error
    }
  }
  
  /**
   * Get purchase statistics
   * @returns {Promise} - Object with statistics
   */
  async getStatistics () {
    try {
      logger.debug('Retrieving purchase statistics')
  
      // Get total number of tickets
      const totalTickets = await this.model.countDocuments()
  
      // Get number of complete and incomplete purchases
      const completeTickets = await this.model.countDocuments({ status: 'complete' })
      const incompleteTickets = await this.model.countDocuments({ status: 'incomplete' })
  
      // Get total revenue
      const revenuePipeline = [
        { $match: { status: 'complete' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]
  
      const revenueResult = await this.model.aggregate(revenuePipeline)
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0
  
      // Get most recent purchases
      const recentPurchases = await this.model.find()
        .sort({ purchase_datetime: -1 })
        .limit(10)
  
      const statistics = {
        totalTickets,
        completeTickets,
        incompleteTickets,
        completionRate: totalTickets > 0 ? (completeTickets / totalTickets) * 100 : 0,
        totalRevenue,
        recentPurchases
      }
  
      logger.info('Purchase statistics retrieved successfully')
      return statistics
    } catch (error) {
      logger.error(`Error getting purchase statistics: ${error.message}`, { stack: error.stack })
      throw error
    }
  }

}
