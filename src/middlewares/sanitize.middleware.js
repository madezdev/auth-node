/**
 * Sanitization middleware
 * Prevents parameter pollution and sanitizes user input
 */

/**
 * Sanitizes request parameters to prevent parameter pollution attacks
 */
export const sanitizeParams = (req, res, next) => {
  // Convert query parameters that should be single values (not arrays)
  if (req.query) {
    const singleValueParams = ['id', 'userId', 'email', 'page', 'limit']

    for (const param of singleValueParams) {
      if (Array.isArray(req.query[param])) {
        req.query[param] = req.query[param][0]
      }
    }
  }

  next()
}

/**
 * Removes any potential NoSQL injection characters
 */
export const preventNoSQLInjection = (req, res, next) => {
  // Check for MongoDB operators in query string that could be used for NoSQL injection
  const hasOperator = Object.keys(req.query || {}).some(key =>
    key.includes('$') || (typeof req.query[key] === 'string' && req.query[key].includes('$'))
  )

  if (hasOperator) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters'
    })
  }

  // Also check body for JSON requests
  if (req.body && typeof req.body === 'object') {
    const checkForOperators = (obj) => {
      for (const key in obj) {
        if (key.includes('$')) {
          return true
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkForOperators(obj[key])) {
            return true
          }
        }
      }
      return false
    }

    if (checkForOperators(req.body)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      })
    }
  }

  next()
}
