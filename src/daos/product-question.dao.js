import { BaseDao } from './base.dao.js'
import { ProductQuestionModel } from '../models/product-question.model.js'

/**
 * Product Question DAO
 * Handles all data access operations for product questions and answers
 */
export class ProductQuestionDao extends BaseDao {
  constructor() {
    super(ProductQuestionModel)
  }

  /**
   * Get all questions for a specific product
   * @param {string} productId - The ID of the product
   * @param {Object} options - Query options like sort, limit, etc.
   * @returns {Promise<Array>} - Array of product questions
   */
  async getByProductId(productId, options = {}) {
    return this.model.find({ product: productId }, null, options)
      .populate('user', 'first_name last_name email')
      .populate('answeredBy', 'first_name last_name email')
      .sort({ createdAt: -1 })
  }

  /**
   * Get all questions asked by a specific user
   * @param {string} userId - The ID of the user
   * @param {Object} options - Query options like sort, limit, etc.
   * @returns {Promise<Array>} - Array of questions asked by the user
   */
  async getByUserId(userId, options = {}) {
    return this.model.find({ user: userId }, null, options)
      .populate('product', 'name image')
      .populate('answeredBy', 'first_name last_name')
      .sort({ createdAt: -1 })
  }

  /**
   * Get all unanswered questions (for admin use)
   * @param {Object} options - Query options like sort, limit, etc.
   * @returns {Promise<Array>} - Array of unanswered questions
   */
  async getUnansweredQuestions(options = {}) {
    return this.model.find({ isAnswered: false }, null, options)
      .populate('product', 'name image')
      .populate('user', 'first_name last_name email')
      .sort({ createdAt: 1 }) // Oldest first
  }

  /**
   * Answer a product question
   * @param {string} questionId - The ID of the question
   * @param {string} answer - The answer text
   * @param {string} adminId - The ID of the admin answering the question
   * @returns {Promise<Object>} - Updated question object
   */
  async answerQuestion(questionId, answer, adminId) {
    return this.model.findByIdAndUpdate(
      questionId,
      {
        answer,
        answeredBy: adminId,
        isAnswered: true
      },
      { new: true }
    ).populate('product user answeredBy')
  }
}
