/* eslint-disable camelcase */
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/user.repository.js'
import { cartRepository } from '../repositories/cart.repository.js'
import { passwordResetRepository } from '../repositories/password-reset.repository.js'
import { createCurrentUserDTO } from '../dtos/user.dto.js'
import config from '../config/index.js'
import logger from '../config/logger.config.js'

// Crear un nuevo administrador
export const createAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body

    logger.debug(`Intento de creación de admin: ${email}`)

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.getCompleteUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already in use' })
    }

    // Crear un nuevo carrito para el usuario
    const newCart = await cartRepository.create({})

    // Crear nuevo usuario administrador con referencia al carrito
    const userData = {
      first_name,
      last_name,
      email,
      age,
      password,
      cart: newCart.id,
      role: 'admin' // Set role to admin
    }
    
    const newUser = await userRepository.createUser(userData)

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      config.SECRET,
      { expiresIn: '24h' }
    )

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    logger.info(`Admin creado exitosamente: ${email} (ID: ${newUser._id})`)
    return res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      token // Still include token in response for API clients
    })
  } catch (error) {
    logger.error(`Error al crear admin: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during admin creation',
      error: error.message
    })
  }
}

// Registrar un nuevo usuario
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body

    logger.debug(`Intento de registro: ${email}`)

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.getCompleteUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already in use' })
    }

    // Crear un nuevo carrito para el usuario
    const newCart = await cartRepository.create({})

    // Crear nuevo usuario con referencia al carrito
    const userData = {
      first_name,
      last_name,
      email,
      age,
      password,
      cart: newCart.id,
      role: 'guest' // Default role for new users
    }
    
    const newUser = await userRepository.createUser(userData)

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      config.SECRET,
      { expiresIn: '24h' }
    )

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    logger.info(`Usuario registrado exitosamente: ${email} (ID: ${newUser._id})`)
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token // Still include token in response for API clients
    })
  } catch (error) {
    logger.error(`Error en registro: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration',
      error: error.message
    })
  }
}

// Login usuario
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    logger.debug(`Intento de login: ${email}`)

    // Buscar usuario por email
    const user = await userRepository.getCompleteUserByEmail(email)
    if (!user) {
      logger.warn(`Intento de login con email no registrado: ${email}`)
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    // Validar contraseña
    const isPasswordValid = user.isValidPassword(password)
    if (!isPasswordValid) {
      logger.warn(`Intento de login con contraseña incorrecta: ${email}`)
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    }
    
    // Verificar si el perfil está completo y actualizar el rol si es necesario
    await userRepository.checkAndUpdateUserRole(user._id)

    logger.debug(`Credenciales válidas para: ${email}`)

    // Generar JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.SECRET,
      { expiresIn: '24h' }
    )

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    logger.info(`Login exitoso: ${email} (ID: ${user._id}, Role: ${user.role})`)
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token // Still include token in response for API clients
    })
  } catch (error) {
    logger.error(`Error en login: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
      error: error.message
    })
  }
}

// Obtener usuario actual
// Logout usuario
export const logout = (req, res) => {
  try {
    // Identificar usuario por su token si está disponible
    const userEmail = req.user ? req.user.email : 'unknown'

    logger.debug(`Intento de logout: ${userEmail}`)

    // Clear the HTTP-only cookie
    res.clearCookie('token')

    logger.info(`Logout exitoso: ${userEmail}`)
    return res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error(`Error en logout: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout',
      error: error.message
    })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    // req.user es establecido por el middleware de autenticación de Passport
    const user = req.user

    logger.debug(`Solicitud de información del usuario actual: ${user.email}`)
    
    // Verificar si el perfil está completo y actualizar el rol si es necesario
    await userRepository.checkAndUpdateUserRole(user._id)
    
    // Obtener usuario actualizado con información completa
    const updatedUser = await userRepository.getCompleteUserByEmail(user.email)
    
    // Crear DTO con información no sensible
    const userDTO = createCurrentUserDTO(updatedUser)

    // Devolver datos del usuario sin información sensible
    logger.info(`Información del usuario actual enviada: ${user.email}`)
    return res.status(200).json({
      status: 'success',
      user: userDTO
    })
  } catch (error) {
    logger.error(`Error al obtener usuario actual: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving user data',
      error: error.message
    })
  }
}

// Solicitar recuperación de contraseña
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }
    
    logger.debug(`Intento de recuperación de contraseña para: ${email}`);
    
    // Generar base URL para el enlace de reset
    const baseUrl = `${req.protocol}://${req.get('host')}/api/sessions/reset-password`;
    
    // Solicitar reset de contraseña
    const result = await passwordResetRepository.requestPasswordReset(email, baseUrl);
    
    // Siempre devolvemos el mismo mensaje independientemente de si el usuario existe
    // para evitar fugas de información sobre usuarios registrados
    return res.status(200).json({
      status: 'success',
      message: 'If a user with that email exists, a password reset link will be sent'
    });
  } catch (error) {
    logger.error(`Error en solicitud de reset de contraseña: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during the password reset request',
      error: error.message
    });
  }
};

// Validar token de recuperación de contraseña
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token is required'
      });
    }
    
    logger.debug(`Validando token de reset: ${token}`);
    
    // Validar token
    const result = await passwordResetRepository.validateResetToken(token);
    
    if (!result.valid) {
      return res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      userId: result.userId,
      email: result.email
    });
  } catch (error) {
    logger.error(`Error en validación de token: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during token validation',
      error: error.message
    });
  }
};

// Resetear contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token and new password are required'
      });
    }
    
    logger.debug(`Intento de reset de contraseña con token: ${token}`);
    
    // Resetear contraseña
    const result = await passwordResetRepository.resetPassword(token, password);
    
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    logger.error(`Error en reset de contraseña: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during password reset',
      error: error.message
    });
  }
};
