import { BaseRepository } from './base.repository.js'
import { CartModel } from '../models/cart.model.js'

/**
 * Repository for Cart-related database operations
 */
export class CartRepository extends BaseRepository {
  constructor () {
    super(CartModel)
  }

  /**
   * Find cart by user ID
   * @param {String} userId - User ID
   * @returns {Promise} - Cart document or null
   */
  async findByUser (userId) {
    return this.model.findOne({ user: userId }).populate('products.product')
  }

  /**
   * Add product to cart
   * @param {String} cartId - Cart ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - Product quantity
   * @returns {Promise} - Updated cart
   */
  async addProduct (cartId, productId, quantity = 1) {
    const cart = await this.model.findById(cartId)

    if (!cart) {
      throw new Error('Cart not found')
    }

    const productIndex = cart.products.findIndex(
      item => item.product.toString() === productId.toString()
    )

    if (productIndex > -1) {
      // Product already in cart, update quantity
      cart.products[productIndex].quantity += quantity
    } else {
      // Add new product to cart
      cart.products.push({
        product: productId,
        quantity
      })
    }

    return cart.save()
  }

  /**
   * Update product quantity in cart
   * @param {String} cartId - Cart ID
   * @param {String} productId - Product ID
   * @param {Number} quantity - New product quantity
   * @returns {Promise} - Updated cart
   */
  async updateProductQuantity (cartId, productId, quantity) {
    return this.model.findOneAndUpdate(
      {
        _id: cartId,
        'products.product': productId
      },
      {
        $set: { 'products.$.quantity': quantity }
      },
      { new: true }
    ).populate('products.product')
  }

  /**
   * Remove product from cart
   * @param {String} cartId - Cart ID
   * @param {String} productId - Product ID
   * @returns {Promise} - Updated cart
   */
  async removeProduct (cartId, productId) {
    return this.model.findByIdAndUpdate(
      cartId,
      {
        $pull: { products: { product: productId } }
      },
      { new: true }
    ).populate('products.product')
  }

  /**
   * Clear cart products
   * @param {String} cartId - Cart ID
   * @returns {Promise} - Updated cart
   */
  async clearCart (cartId) {
    return this.model.findByIdAndUpdate(
      cartId,
      { $set: { products: [] } },
      { new: true }
    )
  }
}
