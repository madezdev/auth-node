import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { cartOwnershipMiddleware } from '../middlewares/role.middleware.js'
import { completeProfileRequired } from '../middlewares/cart.middleware.js'
import {
  createCart,
  getCartById,
  addProductToCart,
  updateProductQuantity,
  removeProductFromCart,
  emptyCart,
  processCheckout
} from '../controllers/cart.controller.js'

const router = Router()

// Aplicamos middleware de autenticación a cada ruta individualmente
// en lugar de aplicarlo globalmente a todas las rutas

// Crear un nuevo carrito
router.post('/', authenticateToken, createCart)

// Obtener un carrito por ID
router.get('/:id', authenticateToken, cartOwnershipMiddleware(), getCartById)

// Agregar un producto al carrito
router.post('/:id/products/:pid', authenticateToken, completeProfileRequired(), cartOwnershipMiddleware(), addProductToCart)

// Actualizar la cantidad de un producto en el carrito
router.put('/:id/products/:pid', authenticateToken, completeProfileRequired(), cartOwnershipMiddleware(), updateProductQuantity)

// Eliminar un producto del carrito
router.delete('/:id/products/:pid', authenticateToken, cartOwnershipMiddleware(), removeProductFromCart)

// Vaciar el carrito
router.delete('/:id', authenticateToken, cartOwnershipMiddleware(), emptyCart)

// Procesar la compra del carrito
router.post('/:id/purchase', authenticateToken, completeProfileRequired(), cartOwnershipMiddleware(), processCheckout)

export default router
