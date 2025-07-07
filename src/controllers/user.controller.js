/* eslint-disable camelcase */
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

    if (!id || id === 'undefined') {
      return res.status(400).json({
        status: 'error',
        message: 'Valid user ID is required'
      })
    }

    // Extraer datos de la solicitud - soportando tanto camelCase como snake_case
    const {
      firstName, lastName, age, role, // camelCase
      first_name, last_name, // snake_case
      idNumber, birthDate, activityType, activityNumber, phone, // Otros campos
      address // Dirección completa
    } = req.body

    logger.debug(`Intento de actualización para usuario ID: ${id}`)

    // Crear objeto de actualización con los campos proporcionados
    const updateData = {}

    // Manejar diferentes formatos (camelCase y snake_case)
    if (firstName || first_name) updateData.first_name = firstName || first_name
    if (lastName || last_name) updateData.last_name = lastName || last_name
    if (age) updateData.age = age
    if (role) updateData.role = role

    // Otros campos del modelo
    if (idNumber) updateData.idNumber = idNumber
    if (birthDate) updateData.birthDate = birthDate
    if (activityType) updateData.activityType = activityType
    if (activityNumber) updateData.activityNumber = activityNumber
    if (phone) updateData.phone = phone

    // Manejar dirección como un objeto completo si se proporciona
    if (address) updateData.address = address

    logger.debug(`Datos de actualización: ${JSON.stringify(updateData)}`)

    // Si no hay campos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields provided for update'
      })
    }

    try {
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

      // Comprobar si el usuario ahora tiene perfil completo
      const userIsCompleted = !!(updatedUser.first_name && updatedUser.last_name &&
        updatedUser.idNumber && updatedUser.birthDate &&
        updatedUser.activityType && updatedUser.activityNumber &&
        updatedUser.email && updatedUser.phone)

      const addressIsCompleted = !!(updatedUser.address && updatedUser.address.street &&
        updatedUser.address.city && updatedUser.address.state &&
        updatedUser.address.zipCode && updatedUser.address.country)

      // Actualizar rol si es necesario
      if (updatedUser.role === 'guest' && userIsCompleted && addressIsCompleted) {
        await UserModel.updateOne({ _id: id }, { role: 'user' })
        updatedUser.role = 'user'
        logger.info(`Rol de usuario actualizado a 'user' para ID: ${id}`)
      }

      logger.info(`Usuario actualizado exitosamente: ${updatedUser.email} (ID: ${updatedUser._id})`)
      return res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        user: updatedUser,
        userIsCompleted,
        addressIsCompleted
      })
    } catch (err) {
      if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user ID format'
        })
      }
      throw err
    }
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
