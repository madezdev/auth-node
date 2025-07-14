import { BaseRepository } from './base.repository.js';
import { TicketDao } from '../daos/ticket.dao.js';
import { productRepository } from './product.repository.js';
import { cartRepository } from './cart.repository.js';
import logger from '../config/logger.config.js';

/**
 * Ticket Repository
 * Implements business logic for purchase operations
 */
export class TicketRepository extends BaseRepository {
  constructor() {
    const ticketDao = new TicketDao();
    super(ticketDao);
    logger.debug('TicketRepository initialized');
  }

  /**
   * Get all tickets for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of tickets
   */
  async getTicketsByUser(userId) {
    try {
      return await this.dao.findByUser(userId);
    } catch (error) {
      logger.error(`Error in TicketRepository.getTicketsByUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed ticket information
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Detailed ticket
   */
  async getTicketDetails(ticketId) {
    try {
      return await this.dao.getDetailedTicket(ticketId);
    } catch (error) {
      logger.error(`Error in TicketRepository.getTicketDetails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a cart purchase
   * @param {string} cartId - Cart ID
   * @param {Object} userData - User data for the purchase
   * @returns {Promise<Object>} Purchase result with ticket information
   */
  async createPurchase(cartId, userData) {
    try {
      // Get cart with products
      const cart = await cartRepository.getCartWithProducts(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      if (!cart.products || cart.products.length === 0) {
        return {
          success: false,
          message: 'The cart is empty'
        };
      }
      
      // Variables to track purchase process
      const purchasedProducts = [];
      const failedProducts = [];
      let totalAmount = 0;
      
      // Process each product in cart
      for (const item of cart.products) {
        // Skip if product reference is invalid
        if (!item.product || typeof item.product !== 'object') {
          continue;
        }
        
        const productId = item.product._id.toString();
        const requestedQuantity = item.quantity;
        
        // Check if product has sufficient stock
        const hasStock = await productRepository.checkProductStock(productId, requestedQuantity);
        
        if (hasStock) {
          // Add to purchased products
          purchasedProducts.push({
            product: productId,
            name: item.product.name,
            price: item.product.price,
            quantity: requestedQuantity
          });
          
          // Update product stock
          await productRepository.updateProductStock(productId, -requestedQuantity);
          
          // Add to total amount
          totalAmount += (item.product.price * requestedQuantity);
        } else {
          // Get current stock
          const product = await productRepository.getById(productId);
          
          // Add to failed products
          failedProducts.push({
            product: productId,
            name: item.product.name,
            price: item.product.price,
            quantity: product.stock,
            requested_quantity: requestedQuantity
          });
        }
      }
      
      // If no products could be purchased
      if (purchasedProducts.length === 0) {
        return {
          success: false,
          message: 'No products have sufficient stock',
          failedProducts
        };
      }
      
      // Generate ticket
      const ticketCode = await this.dao.generateUniqueCode();
      
      const ticketData = {
        code: ticketCode,
        amount: totalAmount,
        purchaser: userData.email,
        user: userData.id,
        products: purchasedProducts,
        failed_products: failedProducts,
        status: failedProducts.length > 0 ? 'incomplete' : 'complete'
      };
      
      const newTicket = await this.dao.create(ticketData);
      
      // Remove purchased products from cart
      const purchasedProductIds = purchasedProducts.map(p => p.product);
      
      for (const productId of purchasedProductIds) {
        await cartRepository.removeProductFromCart(cartId, productId);
      }
      
      return {
        success: true,
        message: failedProducts.length > 0 
          ? 'Purchase completed with some products unavailable due to insufficient stock'
          : 'Purchase completed successfully',
        ticket: newTicket,
        failedProducts: failedProducts.length > 0 ? failedProducts : undefined
      };
    } catch (error) {
      logger.error(`Error in TicketRepository.createPurchase: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const ticketRepository = new TicketRepository();
