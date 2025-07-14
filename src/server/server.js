import express from 'express'
import passport from 'passport'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import config from '../config/index.js'
import { initializePassport } from '../config/passport.config.js'
import { apiLimiter, authLimiter } from '../middlewares/security.middleware.js'
import { errorHandler, notFoundHandler } from '../middlewares/error.middleware.js'
import { CORS_CONFIG, HELMET_CONFIG } from '../config/security.config.js'
import { sanitizeParams, preventNoSQLInjection } from '../middlewares/sanitize.middleware.js'
import sessionRoutes from '../routes/session.routes.js'
import userRoutes from '../routes/user.routes.js'
import cartRoutes from '../routes/cart.routes.js'
import productRoutes from '../routes/product.routes.js'
import orderRoutes from '../routes/order.routes.js'
import productQuestionRoutes from '../routes/product-question.routes.js'
import logger from '../config/logger.config.js'

// Inicializacion de express
const app = express()

// Configurar middlewares básicos para todos los entornos
app.use(express.json({ limit: '10kb' })) // Limitar tamaño del payload JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())
app.use(cors(CORS_CONFIG))

// Inicializacion de passport - necesario para autenticación en todos los entornos
initializePassport()
app.use(passport.initialize())
logger.info('Passport initialized')

// Aplicar middlewares de seguridad avanzados solo en entornos que no sean de test
if (process.env.NODE_ENV !== 'test') {
  // Agrega encabezados de seguridad HTTP con configuración personalizada
  app.use(helmet(HELMET_CONFIG))

  // Servir archivos estáticos con reglas de seguridad
  app.use(express.static('public', { dotfiles: 'deny' }))

  // Middlewares de sanitización para prevenir inyecciones y manipulaciones de parámetros
  app.use(sanitizeParams)
  app.use(preventNoSQLInjection)

  logger.info('Security middlewares applied (helmet, sanitizers)')
}

// Aplicar limitadores de tasa en rutas (excepto en entorno de test)
if (process.env.NODE_ENV !== 'test') {
  // Usar limitadores de tasa en entornos que no son de prueba
  app.use('/api/sessions', authLimiter, sessionRoutes)
  app.use('/api/users', apiLimiter, userRoutes)
  app.use('/api/cart', apiLimiter, cartRoutes)
  app.use('/api/products', apiLimiter, productRoutes)
  app.use('/api/orders', apiLimiter, orderRoutes)
  app.use('/api/product-questions', apiLimiter, productQuestionRoutes)
  logger.info('API routes configured with rate limiters')
} else {
  // En entorno de test, omitir limitadores de tasa
  logger.info('Test environment: Rate limiters disabled')
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/product-questions', productQuestionRoutes)
  logger.debug('API routes configured for test environment')
}

// Root route
app.get('/', (req, res) => {
  logger.http('GET request to root route')
  res.json({
    status: 'success',
    message: 'Welcome to the API',
    endpoints: {
      sessions: '/api/sessions',
      users: '/api/users',
      cart: '/api/cart',
      products: '/api/products',
      orders: '/api/orders',
      productQuestions: '/api/product-questions'
    }
  })
})

// Error handling middlewares para el app exportado
app.use(notFoundHandler)
app.use(errorHandler)
logger.info('Error handling middlewares configured')

export { app }

export class Server {
  constructor () {
    this.port = config.PORT
    this.app = app
    logger.info(`Server instance created with port ${this.port}`)

    // Conectar a la base de datos
    this.conectardb()
  }

  async conectardb () {
    try {
      await config.dbConnection()
      logger.info('Database connection established successfully')
    } catch (error) {
      logger.error(`Database connection error: ${error.message}`, { stack: error.stack })
    }
  }

  routes () {
    // Configurar middlewares de seguridad
    this.app.use(helmet(HELMET_CONFIG))
    this.app.use(express.json({ limit: '10kb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }))
    this.app.use(cookieParser())
    this.app.use(cors(CORS_CONFIG))
    this.app.use(express.static('public', { dotfiles: 'deny' }))
    logger.info('Server middlewares configured')

    // Inicializar passport
    this.app.use(passport.initialize())
    logger.info('Passport initialized in Server instance')

    // Middlewares de sanitización para prevenir inyecciones
    this.app.use(sanitizeParams)
    this.app.use(preventNoSQLInjection)
    logger.info('Sanitization middlewares applied')

    // API routes con limitadores de tasa
    this.app.use('/api/sessions', authLimiter, sessionRoutes)
    this.app.use('/api/users', apiLimiter, userRoutes)
    this.app.use('/api/cart', apiLimiter, cartRoutes)
    this.app.use('/api/products', apiLimiter, productRoutes)
    this.app.use('/api/orders', apiLimiter, orderRoutes)
    this.app.use('/api/product-questions', apiLimiter, productQuestionRoutes)
    logger.info('API routes configured with rate limiters in Server instance')

    // Root route
    this.app.get('/', (req, res) => {
      logger.http('GET request to root route in Server instance')
      res.json({
        status: 'success',
        message: 'Welcome to the API',
        endpoints: {
          sessions: '/api/sessions',
          users: '/api/users',
          cart: '/api/cart',
          products: '/api/products',
          orders: '/api/orders',
          productQuestions: '/api/product-questions'
        }
      })
    })

    // Middlewares de manejo de errores
    this.app.use(notFoundHandler)
    this.app.use(errorHandler)
    logger.info('Error handling middlewares configured in Server instance')
  }

  start () {
    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`)
    })
  }
}
