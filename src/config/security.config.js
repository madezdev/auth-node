/**
 * Central security configuration file
 * Contains all security-related settings used throughout the application
 */

// Password settings
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  SALT_ROUNDS: 10, // For bcrypt
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
}

// JWT settings
export const JWT_CONFIG = {
  EXPIRES_IN: '24h', // 24 hours
  ALGORITHM: 'HS256',
  COOKIE_NAME: 'token'
}

// Cookie settings
export const COOKIE_CONFIG = {
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production', // Only use secure in production
  SAME_SITE: 'strict',
  MAX_AGE: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
}

// Rate limiting settings
export const RATE_LIMIT_CONFIG = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5 // 5 requests per IP in 15 minutes window for authentication routes
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100 // 100 requests per IP in 15 minutes window for regular API routes
  }
}

// CORS settings
export const CORS_CONFIG = {
  ORIGIN: process.env.CLIENT_URL || '*', // Ideally limit to specific domain in production
  CREDENTIALS: true,
  OPTIONS_SUCCESS_STATUS: 200,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization']
}

// Security headers provided by helmet
export const HELMET_CONFIG = {
  // contentSecurityPolicy configuration
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}
