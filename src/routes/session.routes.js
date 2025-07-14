import { Router } from 'express'
import {
  register,
  login,
  getCurrentUser,
  createAdmin,
  logout,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
} from '../controllers/auth.controller.js'
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js'
import { validateRegistration, validateLogin } from '../middlewares/validation.middleware.js'

const router = Router()

// Rutas de autenticación
router.post('/register', validateRegistration, register)
router.post('/login', validateLogin, login)

// Ruta de creación de admin (con bypass para tests)
if (process.env.NODE_ENV === 'test') {
  // En tests, no requiere autenticación
  router.post('/admin', validateRegistration, createAdmin)
} else {
  // En producción/desarrollo, requiere autenticación y rol admin
  router.post('/admin', validateRegistration, authenticateToken, authorizeRole(['admin']), createAdmin)
}

// Ruta del usuario actual con validación de JWT
router.get('/current', authenticateToken, getCurrentUser)

// Ruta de logout
router.get('/logout', logout)

// Password reset routes
router.post('/forgot-password', requestPasswordReset)
router.get('/reset-password/:token', verifyResetToken)
router.post('/reset-password/:token', resetPassword)

export default router
