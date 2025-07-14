import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { adminMiddleware } from '../middlewares/authorization.middleware.js'
import { productQuestionController } from '../controllers/product-question.controller.js'

const router = Router()

// Public routes - Get questions for a specific product
router.get('/product/:productId', productQuestionController.getProductQuestions.bind(productQuestionController))

// Protected routes - User must be logged in
router.get('/user', authenticateToken, productQuestionController.getUserQuestions.bind(productQuestionController))
router.post('/', authenticateToken, productQuestionController.createQuestion.bind(productQuestionController))

// Admin routes - Only admins can access
router.get('/unanswered', authenticateToken, adminMiddleware(), productQuestionController.getUnansweredQuestions.bind(productQuestionController))
router.post('/:questionId/answer', authenticateToken, adminMiddleware(), productQuestionController.answerQuestion.bind(productQuestionController))

export default router
