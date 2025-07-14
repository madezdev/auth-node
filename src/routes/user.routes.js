import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { userOwnershipMiddleware, roleAuthorization } from '../middlewares/authorization.middleware.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los usuarios (solo admin)
router.get('/', roleAuthorization(['admin']), getAllUsers)

// Obtener usuario por ID (usuario puede ver su propio perfil, admin puede ver cualquier usuario)
router.get('/:id', userOwnershipMiddleware(), getUserById)

// Actualizar usuario (usuario puede actualizar su propio perfil, admin puede actualizar cualquier usuario)
router.put('/:id', userOwnershipMiddleware(), updateUser)

// Eliminar usuario (solo admin)
router.delete('/:id', roleAuthorization(['admin']), deleteUser)

export default router
