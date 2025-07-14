import { BaseRepository } from './base.repository.js'
import { ProductModel } from '../models/product.model.js'

/**
 * Repository for Product-related database operations
 */
export class ProductRepository extends BaseRepository {
  constructor () {
    super(ProductModel)
  }

  /**
   * Find products with pagination
   * @param {Object} query - Filter criteria
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @param {String} sortField - Field to sort by
   * @param {Number} sortOrder - Sort order (1 for ascending, -1 for descending)
   * @returns {Promise} - Paginated products
   */
  async findPaginated (query = {}, page = 1, limit = 10, sortField = 'createdAt', sortOrder = -1) {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortField]: sortOrder }
    }

    return this.model.paginate(query, options)
  }

  /**
   * Check if products have sufficient stock
   * @param {Array} products - Array of product objects with id and quantity
   * @returns {Promise} - Object with available and unavailable products
   */
  async checkProductsStock (products) {
    const productIds = products.map(item => item.product)
    const foundProducts = await this.model.find({ _id: { $in: productIds } })

    const productsMap = foundProducts.reduce((map, product) => {
      map[product._id.toString()] = product
      return map
    }, {})

    const availableProducts = []
    const unavailableProducts = []

    products.forEach(item => {
      const product = productsMap[item.product.toString()]
      if (product && product.stock >= item.quantity) {
        availableProducts.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price
        })
      } else {
        unavailableProducts.push({
          product: item.product,
          quantity: item.quantity,
          available: product ? product.stock : 0
        })
      }
    })

    return { availableProducts, unavailableProducts }
  }

  /**
   * Update stock for multiple products
   * @param {Array} products - Array of product objects with id and quantity
   * @returns {Promise} - Result of update operation
   */
  async updateStock (products) {
    const bulkOperations = products.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } }
      }
    }))

    return this.model.bulkWrite(bulkOperations)
  }
}
