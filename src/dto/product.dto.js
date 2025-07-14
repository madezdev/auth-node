/**
 * Product DTO for transferring product data
 */
export class ProductDTO {
  constructor (product) {
    this.id = product._id
    this.title = product.title
    this.description = product.description
    this.price = product.price
    this.stock = product.stock
    this.category = product.category
    this.thumbnail = product.thumbnail
  }

  /**
   * Create a DTO with simplified product information
   * @param {Object} product - Product document
   * @returns {Object} - Simplified product DTO
   */
  static toSimplified (product) {
    return {
      id: product._id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail
    }
  }

  /**
   * Convert array of products to DTOs
   * @param {Array} products - Array of product documents
   * @returns {Array} - Array of product DTOs
   */
  static toCollection (products) {
    return products.map(product => new ProductDTO(product))
  }
}
