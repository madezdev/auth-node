import { BaseRepository } from './base.repository.js';
import { ProductDao } from '../daos/product.dao.js';
import logger from '../config/logger.config.js';

/**
 * Product Repository
 * Implements business logic for product operations
 */
export class ProductRepository extends BaseRepository {
  constructor() {
    const productDao = new ProductDao();
    super(productDao);
    logger.debug('ProductRepository initialized');
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @returns {Promise<Array>} List of products
   */
  async getProductsByCategory(category) {
    try {
      return await this.dao.findByCategory(category);
    } catch (error) {
      logger.error(`Error in ProductRepository.getProductsByCategory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get products with available stock
   * @param {number} minStock - Minimum stock required
   * @returns {Promise<Array>} List of products
   */
  async getProductsWithStock(minStock = 1) {
    try {
      return await this.dao.findWithStock(minStock);
    } catch (error) {
      logger.error(`Error in ProductRepository.getProductsWithStock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to update (positive adds, negative subtracts)
   * @returns {Promise<Product>} Updated product
   */
  async updateProductStock(id, quantity) {
    try {
      return await this.dao.updateStock(id, quantity);
    } catch (error) {
      logger.error(`Error in ProductRepository.updateProductStock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if product has sufficient stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity requested
   * @returns {Promise<boolean>} True if enough stock is available
   */
  async checkProductStock(id, quantity) {
    try {
      return await this.dao.hasStock(id, quantity);
    } catch (error) {
      logger.error(`Error in ProductRepository.checkProductStock: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
