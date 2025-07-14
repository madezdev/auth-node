import logger from '../config/logger.js'
import { ProductQuestionDao } from '../daos/product-question.dao.js'
import { createProductQuestionDTO, createProductQuestionsDTO } from '../dtos/product-question.dto.js'

/**
 * Product Question Controller
 * Handles operations related to product questions and answers
 */
export class ProductQuestionController {
  constructor () {
    this.productQuestionDao = new ProductQuestionDao()
  }

  /**
   * Get questions for a specific product
   */
  async getProductQuestions (req, res) {
    try {
      const { productId } = req.params
      logger.info(`Fetching questions for product: ${productId}`)

      const questions = await this.productQuestionDao.getByProductId(productId)
      return res.status(200).json({
        status: 'success',
        payload: createProductQuestionsDTO(questions)
      })
    } catch (error) {
      logger.error(`Error fetching product questions: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch product questions'
      })
    }
  }

  /**
   * Get questions asked by the current user
   */
  async getUserQuestions (req, res) {
    try {
      const userId = req.user.id
      logger.info(`Fetching questions for user: ${userId}`)

      const questions = await this.productQuestionDao.getByUserId(userId)
      return res.status(200).json({
        status: 'success',
        payload: createProductQuestionsDTO(questions)
      })
    } catch (error) {
      logger.error(`Error fetching user questions: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user questions'
      })
    }
  }

  /**
   * Get all unanswered questions (for admin)
   */
  async getUnansweredQuestions (req, res) {
    try {
      logger.info('Admin fetching unanswered questions')

      const questions = await this.productQuestionDao.getUnansweredQuestions()
      return res.status(200).json({
        status: 'success',
        payload: createProductQuestionsDTO(questions)
      })
    } catch (error) {
      logger.error(`Error fetching unanswered questions: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch unanswered questions'
      })
    }
  }

  /**
   * Create a new product question
   */
  async createQuestion (req, res) {
    try {
      const { productId, question } = req.body
      const userId = req.user.id

      logger.info(`User ${userId} asking question about product ${productId}`)

      if (!question || question.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Question cannot be empty'
        })
      }

      const newQuestion = await this.productQuestionDao.create({
        product: productId,
        user: userId,
        question
      })

      return res.status(201).json({
        status: 'success',
        payload: createProductQuestionDTO(newQuestion)
      })
    } catch (error) {
      logger.error(`Error creating question: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create question'
      })
    }
  }

  /**
   * Answer a product question (admin only)
   */
  async answerQuestion (req, res) {
    try {
      const { questionId } = req.params
      const { answer } = req.body
      const adminId = req.user.id

      logger.info(`Admin ${adminId} answering question ${questionId}`)

      if (!answer || answer.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Answer cannot be empty'
        })
      }

      const updatedQuestion = await this.productQuestionDao.answerQuestion(
        questionId,
        answer,
        adminId
      )

      if (!updatedQuestion) {
        return res.status(404).json({
          status: 'error',
          message: 'Question not found'
        })
      }

      return res.status(200).json({
        status: 'success',
        payload: createProductQuestionDTO(updatedQuestion)
      })
    } catch (error) {
      logger.error(`Error answering question: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to answer question'
      })
    }
  }
}

// Export a singleton instance
export const productQuestionController = new ProductQuestionController()
