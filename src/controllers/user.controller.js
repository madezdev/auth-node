import { UserModel } from '../models/user.model.js'
import logger from '../config/logger.config.js'

// Obtener todos los usuarios (solo admin)
export const getAllUsers = async (req, res) => {
  try {
    logger.debug('Solicitud para obtener todos los usuarios')
    const users = await UserModel.find().select('-password')
    logger.info(`Se recuperaron ${users.length} usuarios exitosamente`)
    return res.status(200).json({
      status: 'success',
      users
    })
  } catch (error) {
    logger.error(`Error al obtener usuarios: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving users',
      error: error.message
    })
  }
}

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    logger.debug(`Buscando usuario por ID: ${id}`)
    const user = await UserModel.findById(id).select('-password')

    if (!user) {
      logger.warn(`Usuario no encontrado con ID: ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    logger.info(`Usuario recuperado exitosamente: ${user.email} (ID: ${user._id})`)
    return res.status(200).json({
      status: 'success',
      user
    })
  } catch (error) {
    logger.error(`Error al obtener usuario por ID: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving the user',
      error: error.message
    })
  }
}

// Actualizar usuario (usuario puede actualizar su propio perfil, admin puede actualizar cualquier usuario)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, age, role } = req.body

    logger.debug(`Intento de actualización para usuario ID: ${id}`)

    // Create update object with only provided fields
    const updateData = {}
    if (firstName) updateData.first_name = firstName
    if (lastName) updateData.last_name = lastName
    if (age) updateData.age = age
    if (role) updateData.role = role

    logger.debug(`Datos de actualización: ${JSON.stringify(updateData)}`)

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      logger.warn(`Intento de actualizar usuario inexistente ID: ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    logger.info(`Usuario actualizado exitosamente: ${updatedUser.email} (ID: ${updatedUser._id})`)
    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      user: updatedUser
    })
  } catch (error) {
    logger.error(`Error al actualizar usuario: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the user',
      error: error.message
    })
  }
}

// Eliminar usuario (solo admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    logger.debug(`Intento de eliminación de usuario ID: ${id}`)
    const deletedUser = await UserModel.findByIdAndDelete(id)

    if (!deletedUser) {
      logger.warn(`Intento de eliminar usuario inexistente ID: ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    logger.info(`Usuario eliminado exitosamente: ${deletedUser.email} (ID: ${deletedUser._id})`)
    return res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    })
  } catch (error) {
    logger.error(`Error al eliminar usuario: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the user',
      error: error.message
    })
  }
}
