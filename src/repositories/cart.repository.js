import { BaseRepository } from './base.repository.js';
import { CartDao } from '../daos/cart.dao.js';
import { productRepository } from './product.repository.js';
import logger from '../config/logger.config.js';

/**
 * Cart Repository
 * Implements business logic for cart operations
 */
export class CartRepository extends BaseRepository {
  constructor() {
    const cartDao = new CartDao();
    super(cartDao);
    logger.debug('CartRepository initialized');
  }

  /**
   * Get cart with product details
   * @param {string} cartId - Cart ID
   * @returns {Promise<Cart>} Cart with populated products
   */
  async getCartWithProducts(cartId) {
    try {
      return await this.dao.getPopulatedCart(cartId);
    } catch (error) {
      logger.error(`Error in CartRepository.getCartWithProducts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add product to cart with stock validation
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Operation result with cart
   */
  async addProductToCart(cartId, productId, quantity = 1) {
    try {
      // Check product stock before adding to cart
      const hasStock = await productRepository.checkProductStock(productId, quantity);
      
      if (!hasStock) {
        return {
          success: false,
          message: 'Insufficient product stock',
          cart: await this.getCartWithProducts(cartId)
        };
      }
      
      // Add product to cart
      const updatedCart = await this.dao.addProduct(cartId, productId, quantity);
      
      return {
        success: true,
        message: 'Product added to cart',
        cart: await this.getCartWithProducts(cartId)
      };
    } catch (error) {
      logger.error(`Error in CartRepository.addProductToCart: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product quantity in cart with stock validation
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Operation result with cart
   */
  async updateProductInCart(cartId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeProductFromCart(cartId, productId);
      }
      
      // Check product stock before updating quantity
      const hasStock = await productRepository.checkProductStock(productId, quantity);
      
      if (!hasStock) {
        return {
          success: false,
          message: 'Insufficient product stock',
          cart: await this.getCartWithProducts(cartId)
        };
      }
      
      // Update product quantity in cart
      await this.dao.updateProductQuantity(cartId, productId, quantity);
      
      return {
        success: true,
        message: 'Product quantity updated',
        cart: await this.getCartWithProducts(cartId)
      };
    } catch (error) {
      logger.error(`Error in CartRepository.updateProductInCart: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove product from cart
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Operation result with cart
   */
  async removeProductFromCart(cartId, productId) {
    try {
      // Remove product from cart
      await this.dao.removeProduct(cartId, productId);
      
      return {
        success: true,
        message: 'Product removed from cart',
        cart: await this.getCartWithProducts(cartId)
      };
    } catch (error) {
      logger.error(`Error in CartRepository.removeProductFromCart: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear cart (remove all products)
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Operation result
   */
  async clearCart(cartId) {
    try {
      // Clear cart
      await this.dao.clearCart(cartId);
      
      return {
        success: true,
        message: 'Cart cleared',
        cart: await this.getCartWithProducts(cartId)
      };
    } catch (error) {
      logger.error(`Error in CartRepository.clearCart: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance
export const cartRepository = new CartRepository();
