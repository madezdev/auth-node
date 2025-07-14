import httpMocks from 'node-mocks-http'
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { completeProfileRequired } from '../src/middlewares/cart.middleware.js'
import { adminProductCreation } from '../src/middlewares/product.middleware.js'
import { cartOwnershipMiddleware } from '../src/middlewares/role.middleware.js'
import { EventEmitter } from 'events'

// Mock de logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn()
}

// Mock de módulos
jest.mock('../src/config/logger.config.js', () => ({
  __esModule: true,
  default: mockLogger
}))

describe('Middleware Tests', () => {
  let req, res, next

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    // Create fresh request and response objects for each test
    req = httpMocks.createRequest()
    res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    })
    next = jest.fn()
  })

  describe('completeProfileRequired Middleware', () => {
    it('should deny access to users with guest role (incomplete profile)', () => {
      // Set up test conditions
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'guest'
      }

      // Call the middleware
      const middleware = completeProfileRequired()
      middleware(req, res, next)

      // Verify expectations
      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        status: 'error',
        message: 'Please complete your profile before using the cart',
        code: 'INCOMPLETE_PROFILE'
      })
      expect(mockLogger.warn).toHaveBeenCalled()
    })

    it('should allow access to users with user role (complete profile)', () => {
      // Set up test conditions
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      }

      // Call the middleware
      const middleware = completeProfileRequired()
      middleware(req, res, next)

      // Verify expectations
      expect(next).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should allow access to admin users', () => {
      // Set up test conditions
      req.user = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      }

      // Call the middleware
      const middleware = completeProfileRequired()
      middleware(req, res, next)

      // Verify expectations
      expect(next).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should deny access to unauthenticated requests', () => {
      // Set up test conditions (no user in request)
      req.user = undefined

      // Call the middleware
      const middleware = completeProfileRequired()
      middleware(req, res, next)

      // Verify expectations
      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        status: 'error',
        message: 'Authentication required'
      })
      expect(mockLogger.warn).toHaveBeenCalled()
    })
  })

  describe('adminProductCreation Middleware', () => {
    it('should allow access to admin users', () => {
      // Set up test conditions
      req.user = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      }

      // Call the middleware
      const middleware = adminProductCreation()
      middleware(req, res, next)

      // Verify expectations
      expect(next).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should deny access to non-admin users', () => {
      // Set up test conditions
      req.user = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user'
      }

      // Call the middleware
      const middleware = adminProductCreation()
      middleware(req, res, next)

      // Verify expectations
      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        status: 'error',
        message: 'Only administrators can create new products'
      })
      expect(mockLogger.warn).toHaveBeenCalled()
    })
  })

  describe('cartOwnershipMiddleware', () => {
    it('should allow access to cart owner', () => {
      // Set up test conditions
      const cartId = 'cart123'
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        cart: cartId
      }
      req.params = { id: cartId }

      // Call the middleware
      const middleware = cartOwnershipMiddleware()
      middleware(req, res, next)

      // Verify expectations
      expect(next).toHaveBeenCalled()
    })

    it('should deny access to non-owner users', () => {
      // Set up test conditions
      const userCartId = 'cart123'
      const requestedCartId = 'cart456'

      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        cart: userCartId
      }
      req.params = { id: requestedCartId }

      // Call the middleware
      const middleware = cartOwnershipMiddleware()
      middleware(req, res, next)

      // Verify expectations
      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(403)
    })

    it('should allow access to admin users regardless of cart ownership', () => {
      // Set up test conditions
      const adminCartId = 'adminCart'
      const requestedCartId = 'userCart'

      req.user = {
        _id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        cart: adminCartId
      }
      req.params = { id: requestedCartId }

      // Call the middleware
      const middleware = cartOwnershipMiddleware()
      middleware(req, res, next)

      // Verify expectations
      expect(next).toHaveBeenCalled()
    })
  })
})
