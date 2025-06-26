/* eslint-disable camelcase */
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.model.js'
import { CartModel } from '../models/cart.model.js'
import config from '../config/index.js'
import logger from '../config/logger.config.js'

// Crear un nuevo administrador
export const createAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body

    logger.debug(`Intento de creación de admin: ${email}`)

    // Verificar si el usuario ya existe
    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already in use' })
    }

    // Crear un nuevo carrito para el usuario
    const newCart = await CartModel.create({})

    // Crear nuevo usuario administrador con referencia al carrito
    const newUser = await UserModel.create({
      first_name,
      last_name,
      email,
      age,
      password,
      cart: newCart._id,
      role: 'admin' // Set role to admin
    })

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
    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already in use' })
    }

    // Crear un nuevo carrito para el usuario
    const newCart = await CartModel.create({})

    // Crear nuevo usuario con referencia al carrito
    const newUser = await UserModel.create({
      first_name,
      last_name,
      email,
      age,
      password,
      cart: newCart._id
    })

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
    const user = await UserModel.findOne({ email })
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

    // Devolver datos del usuario sin información sensible
    logger.info(`Información del usuario actual enviada: ${user.email}`)
    return res.status(200).json({
      status: 'success',
      user: {
        _id: user._id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        age: user.age,
        cart: user.cart,
        role: user.role
      }
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
