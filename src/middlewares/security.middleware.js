import rateLimit from 'express-rate-limit'
import { RATE_LIMIT_CONFIG } from '../config/security.config.js'
import csrf from 'csurf'
import xss from 'xss'
import logger from '../config/logger.config.js'
import { UserRepository } from '../repositories/user.repository.js'

// Configure rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for auth route: ${req.ip} - ${req.originalUrl}`)
    res.status(429).json(options.message)
  }
})

// Configure general API rate limiting (less strict)
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.API.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.API.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for API route: ${req.ip} - ${req.originalUrl}`)
    res.status(429).json(options.message)
  }
})

// CSRF Protection middleware
export const csrfProtection = csrf({ cookie: true })

// CSRF Error handler
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)

  // Handle CSRF token errors
  logger.warn(`CSRF attack detected: ${req.ip} - ${req.originalUrl}`)
  res.status(403).json({
    status: 'error',
    message: 'Invalid or expired form submission'
  })
}

// XSS sanitization middleware
export const sanitizeInputs = (req, res, next) => {
  try {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key])
        }
      })
    }
    next()
  } catch (error) {
    logger.error(`Error in sanitizeInputs middleware: ${error.message}`)
    next(error)
  }
}

// Account lockout tracking middleware
export const accountLockoutTracker = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email || !req.path.includes('login')) {
      return next()
    }
    
    const userRepository = new UserRepository()
    const user = await userRepository.findByEmail(email)

    // If user doesn't exist, continue to normal flow (don't reveal user existence)
    if (!user) return next()
    
    // Check if account is locked
    if (user.accountLocked && user.accountLockedUntil > new Date()) {
      logger.warn(`Attempt to access locked account: ${email}`)
      return res.status(403).json({
        status: 'error',
        message: 'Account is temporarily locked. Please try again later or reset your password.'
      })
    }
    
    // If account was locked but lock period has expired, reset the lock
    if (user.accountLocked && user.accountLockedUntil <= new Date()) {
      await userRepository.updateById(user._id, {
        accountLocked: false,
        failedLoginAttempts: 0,
        accountLockedUntil: null
      })
    }

    next()
  } catch (error) {
    logger.error(`Error in accountLockoutTracker: ${error.message}`)
    next(error)
  }
}

// Security header validator middleware
export const securityHeaderValidator = (req, res, next) => {
  try {
    // Check for common security headers that should be present
    const missingHeaders = []

    // These headers should have been set by helmet, but we double-check
    if (!res.getHeader('X-Content-Type-Options')) missingHeaders.push('X-Content-Type-Options')
    if (!res.getHeader('X-XSS-Protection')) missingHeaders.push('X-XSS-Protection')
    
    if (missingHeaders.length > 0) {
      logger.warn(`Missing security headers: ${missingHeaders.join(', ')}`)
    }

    next()
  } catch (error) {
    logger.error(`Error in securityHeaderValidator: ${error.message}`)
    next(error)
  }
}

// Suspicious activity monitoring
export const detectSuspiciousActivity = (req, res, next) => {
  try {
    // Gather data for analysis
    const clientIP = req.ip
    const userAgent = req.get('User-Agent') || 'Unknown'
    const requestedPath = req.originalUrl

    // Basic suspicious patterns to check
    const suspiciousPatterns = [
      { pattern: /\.(sql|php|asp|jsp|cgi)$/i, description: 'Attempting to access server scripts' },
      { pattern: /\/\.git|\/\.env|\/config\.json/i, description: 'Attempting to access sensitive files' },
      { pattern: /SELECT|INSERT|UPDATE|DELETE|UNION|DROP|ALTER/i, description: 'SQL-like syntax in request' },
      { pattern: /<script>|<\/script>|alert\(/i, description: 'Script tags in request' }
    ]
    
    // Check for suspicious patterns
    for (const { pattern, description } of suspiciousPatterns) {
      if (pattern.test(requestedPath) || 
        (req.body && JSON.stringify(req.body).match(pattern))) {
        logger.warn(`Suspicious activity detected: ${description} from ${clientIP}, UA: ${userAgent}`)
        // We don't block immediately, just log for now
      }
    }

    next()
  } catch (error) {
    logger.error(`Error in detectSuspiciousActivity: ${error.message}`)
    next(error)
  }
}
