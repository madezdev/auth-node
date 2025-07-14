import { BaseDao } from './base.dao.js';
import { CartModel } from '../models/cart.model.js';
import logger from '../config/logger.config.js';

/**
 * Cart DAO - Data Access Object for Cart operations
 * Extends BaseDao to provide specific functionality for cart data
 */
export class CartDao extends BaseDao {
  constructor() {
    super(CartModel);
    logger.debug('CartDao initialized');
  }

  /**
   * Add product to cart
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Cart>} Updated cart
   */
  async addProduct(cartId, productId, quantity = 1) {
    try {
      const cart = await this.getById(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Check if product already exists in cart
      const existingProductIndex = cart.products.findIndex(
        item => item.product.toString() === productId
      );

      if (existingProductIndex >= 0) {
        // Update existing product quantity
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Add new product to cart
        cart.products.push({
          product: productId,
          quantity
        });
      }

      // Save and return updated cart
      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Error in CartDao.addProduct: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product quantity in cart
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Cart>} Updated cart
   */
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeProduct(cartId, productId);
      }

      const cart = await this.getById(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      const productIndex = cart.products.findIndex(
        item => item.product.toString() === productId
      );

      if (productIndex === -1) {
        throw new Error('Product not found in cart');
      }

      // Update product quantity
      cart.products[productIndex].quantity = quantity;

      // Save and return updated cart
      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Error in CartDao.updateProductQuantity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove product from cart
   * @param {string} cartId - Cart ID
   * @param {string} productId - Product ID
   * @returns {Promise<Cart>} Updated cart
   */
  async removeProduct(cartId, productId) {
    try {
      const cart = await this.getById(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Filter out the specified product
      cart.products = cart.products.filter(
        item => item.product.toString() !== productId
      );

      // Save and return updated cart
      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Error in CartDao.removeProduct: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear cart (remove all products)
   * @param {string} cartId - Cart ID
   * @returns {Promise<Cart>} Updated cart
   */
  async clearCart(cartId) {
    try {
      const cart = await this.getById(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Remove all products
      cart.products = [];

      // Save and return updated cart
      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Error in CartDao.clearCart: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get populated cart (with product details)
   * @param {string} cartId - Cart ID
   * @returns {Promise<Cart>} Cart with populated products
   */
  async getPopulatedCart(cartId) {
    try {
      return await this.model.findById(cartId).populate({
        path: 'products.product',
        select: 'name price description image stock'
      });
    } catch (error) {
      logger.error(`Error in CartDao.getPopulatedCart: ${error.message}`);
      throw error;
    }
  }
}
