import { Router } from 'express'
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js'
import { productFileUpload } from '../middlewares/multer.middleware.js'
import { cloudinaryLogger } from '../middlewares/cloudinary-logger.middleware.js'
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
router.post('/', authenticateToken, authorizeRole(['admin']), productFileUpload, cloudinaryLogger, createProduct)
router.put('/:id', authenticateToken, authorizeRole(['admin']), productFileUpload, cloudinaryLogger, updateProduct)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteProduct)

export default router
