import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { adminProductCreation, adminProductUpdate, adminProductDeletion } from '../middlewares/product.middleware.js'
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
router.post('/', authenticateToken, adminProductCreation(), createProduct)
router.put('/:id', authenticateToken, adminProductUpdate(), updateProduct)
router.delete('/:id', authenticateToken, adminProductDeletion(), deleteProduct)

export default router
