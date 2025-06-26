import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los usuarios (solo admin)
router.get('/', authorizeRole(['admin']), getAllUsers)

// Obtener usuario por ID (usuario puede ver su propio perfil, admin puede ver cualquier usuario)
router.get('/:id', (req, res, next) => {
  // Permite a los usuarios ver su propio perfil
  if (req.user._id.toString() === req.params.id) {
    return next()
  }
  // Para otros perfiles, solo los administradores pueden acceder.
  return authorizeRole(['admin'])(req, res, next)
}, getUserById)

// Actualizar usuario (usuario puede actualizar su propio perfil, admin puede actualizar cualquier usuario)
router.put('/:id', (req, res, next) => {
  // Permite a los usuarios actualizar su propio perfil
  if (req.user._id.toString() === req.params.id) {
    return next()
  }
  // Para otros perfiles, solo los administradores pueden actualizar.
  return authorizeRole(['admin'])(req, res, next)
}, updateUser)

// Eliminar usuario (solo admin)
router.delete('/:id', authorizeRole(['admin']), deleteUser)

export default router
