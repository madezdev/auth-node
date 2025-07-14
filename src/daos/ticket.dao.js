import { BaseDao } from './base.dao.js';
import { TicketModel } from '../models/ticket.model.js';
import logger from '../config/logger.config.js';

/**
 * Ticket DAO - Data Access Object for Ticket operations
 * Extends BaseDao to provide specific functionality for purchase tickets
 */
export class TicketDao extends BaseDao {
  constructor() {
    super(TicketModel);
    logger.debug('TicketDao initialized');
  }

  /**
   * Generate a unique ticket code
   * @returns {string} Unique ticket code
   */
  async generateUniqueCode() {
    try {
      const timestamp = Date.now().toString();
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `TICKET-${timestamp}-${randomPart}`;
      
      // Ensure code is unique
      const existingTicket = await this.model.findOne({ code });
      if (existingTicket) {
        // If code already exists (unlikely), regenerate
        return this.generateUniqueCode();
      }
      
      return code;
    } catch (error) {
      logger.error(`Error in TicketDao.generateUniqueCode: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find tickets by user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of user tickets
   */
  async findByUser(userId) {
    try {
      return await this.model.find({ user: userId })
        .sort({ purchase_datetime: -1 }) // Sort by newest first
        .populate('products.product', 'name price image');
    } catch (error) {
      logger.error(`Error in TicketDao.findByUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find tickets by email
   * @param {string} email - User email
   * @returns {Promise<Array>} List of user tickets
   */
  async findByEmail(email) {
    try {
      return await this.model.find({ purchaser: email })
        .sort({ purchase_datetime: -1 }) // Sort by newest first
        .populate('products.product', 'name price image');
    } catch (error) {
      logger.error(`Error in TicketDao.findByEmail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ticket with detailed product information
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Ticket>} Ticket with populated products
   */
  async getDetailedTicket(ticketId) {
    try {
      return await this.model.findById(ticketId)
        .populate('products.product', 'name price description image')
        .populate('failed_products.product', 'name price description image')
        .populate('user', 'first_name last_name email');
    } catch (error) {
      logger.error(`Error in TicketDao.getDetailedTicket: ${error.message}`);
      throw error;
    }
  }
}
