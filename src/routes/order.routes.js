import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { adminMiddleware } from '../middlewares/authorization.middleware.js'
import { orderController } from '../controllers/order.controller.js'

const router = Router()

// Protected routes - User must be logged in
router.post('/', authenticateToken, orderController.createOrder.bind(orderController))
router.get('/user', authenticateToken, orderController.getUserOrders.bind(orderController))
router.get('/:orderId', authenticateToken, orderController.getOrderById.bind(orderController))

// Admin routes - Only admins can access
router.get('/', authenticateToken, adminMiddleware(), orderController.getAllOrders.bind(orderController))
router.patch('/:orderId/status', authenticateToken, adminMiddleware(), orderController.updateOrderStatus.bind(orderController))

export default router
