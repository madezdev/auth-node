import rateLimit from 'express-rate-limit'
import { RATE_LIMIT_CONFIG } from '../config/security.config.js'

// Configure rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.'
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
  }
})
