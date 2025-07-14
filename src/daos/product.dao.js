import { BaseDao } from './base.dao.js';
import { ProductModel } from '../models/product.model.js';
import logger from '../config/logger.config.js';

/**
 * Product DAO - Data Access Object for Product operations
 * Extends BaseDao to provide specific functionality for product data
 */
export class ProductDao extends BaseDao {
  constructor() {
    super(ProductModel);
    logger.debug('ProductDao initialized');
  }

  /**
   * Find products by category
   * @param {string} category - Product category
   * @returns {Promise<Array>} List of products
   */
  async findByCategory(category) {
    try {
      return await this.model.find({ category });
    } catch (error) {
      logger.error(`Error in ProductDao.findByCategory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find products with stock available
   * @param {number} minStock - Minimum stock required
   * @returns {Promise<Array>} List of products
   */
  async findWithStock(minStock = 1) {
    try {
      return await this.model.find({ stock: { $gte: minStock } });
    } catch (error) {
      logger.error(`Error in ProductDao.findWithStock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to update (positive to add, negative to subtract)
   * @returns {Promise<Product>} Updated product
   */
  async updateStock(id, quantity) {
    try {
      const product = await this.getById(id);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate new stock value and ensure it doesn't go below zero
      const newStock = Math.max(0, product.stock + quantity);
      
      return await this.update(id, { stock: newStock });
    } catch (error) {
      logger.error(`Error in ProductDao.updateStock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if product has sufficient stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity requested
   * @returns {Promise<boolean>} True if enough stock is available
   */
  async hasStock(id, quantity) {
    try {
      const product = await this.getById(id);
      
      if (!product) {
        return false;
      }

      return product.stock >= quantity;
    } catch (error) {
      logger.error(`Error in ProductDao.hasStock: ${error.message}`);
      throw error;
    }
  }
}
