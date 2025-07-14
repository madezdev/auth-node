import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { productAdminMiddleware } from '../middlewares/authorization.middleware.js'
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js'

const router = Router()

// Rutas públicas
router.get('/', getAllProducts)
router.get('/:id', getProductById)

// Rutas protegidas (solo admin)
router.post('/', authenticateToken, productAdminMiddleware(), createProduct)
router.put('/:id', authenticateToken, productAdminMiddleware(), updateProduct)
router.delete('/:id', authenticateToken, productAdminMiddleware(), deleteProduct)

export default router
