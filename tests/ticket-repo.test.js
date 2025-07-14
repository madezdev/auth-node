import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals'
import { TicketRepository } from '../src/repositories/ticket.repository.js'
import { ProductModel } from '../src/models/product.model.js'
import logger from '../src/config/logger.config.js'

// Espiar en los métodos del logger real
beforeAll(() => {
  jest.spyOn(logger, 'debug').mockImplementation(() => {})
  jest.spyOn(logger, 'info').mockImplementation(() => {})
  jest.spyOn(logger, 'warn').mockImplementation(() => {})
  jest.spyOn(logger, 'error').mockImplementation(() => {})
})

describe('TicketRepository Tests', () => {
  let mongoServer
  let ticketRepository
  let productId1
  let productId2

  // Set up MongoDB in-memory server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)

    // Create test products
    const product1 = new ProductModel({
      name: 'Test Product 1',
      description: 'Test Description 1',
      price: 100,
      stock: 50,
      category: 'test'
    })
    const product2 = new ProductModel({
      name: 'Test Product 2',
      description: 'Test Description 2',
      price: 200,
      stock: 5,
      category: 'test'
    })

    const savedProduct1 = await product1.save()
    const savedProduct2 = await product2.save()

    productId1 = savedProduct1._id
    productId2 = savedProduct2._id
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks()
    ticketRepository = new TicketRepository()
  })

  describe('createTicket', () => {
    it('should create a complete ticket with available products', async () => {
      // Arrange
      const purchaserEmail = 'test@example.com'
      const availableProducts = [
        {
          product: productId1,
          quantity: 2,
          price: 100
        }
      ]
      const total = 200

      // Act
      const ticket = await ticketRepository.createTicket(purchaserEmail, availableProducts, total)

      // Assert
      expect(ticket).toBeDefined()
      expect(ticket.purchaser).toBe(purchaserEmail)
      expect(ticket.amount).toBe(total)
      expect(ticket.products).toHaveLength(1)
      expect(ticket.status).toBe('complete')
      expect(ticket.code).toBeDefined()
      expect(logger.info).toHaveBeenCalled()
    })

    it('should create an incomplete ticket when unavailable products exist', async () => {
      // Arrange
      const purchaserEmail = 'test@example.com'
      const availableProducts = [
        {
          product: productId1,
          quantity: 2,
          price: 100
        }
      ]
      const unavailableProducts = [
        {
          product: productId2,
          quantity: 10,
          available: 5
        }
      ]
      const total = 200

      // Act
      const ticket = await ticketRepository.createTicket(purchaserEmail, availableProducts, total, unavailableProducts)

      // Assert
      expect(ticket).toBeDefined()
      expect(ticket.purchaser).toBe(purchaserEmail)
      expect(ticket.amount).toBe(total)
      expect(ticket.products).toHaveLength(1)
      expect(ticket.status).toBe('incomplete')
      expect(ticket.failedProducts).toHaveLength(1)
      expect(ticket.code).toBeDefined()
      expect(logger.warn).toHaveBeenCalled()
    })
  })

  describe('checkProductsAvailability', () => {
    it('should separate available and unavailable products', async () => {
      // Arrange
      const cartProducts = [
        {
          product: productId1,
          quantity: 10 // available (stock is 50)
        },
        {
          product: productId2,
          quantity: 10 // unavailable (stock is 5)
        }
      ]

      // Act
      const result = await ticketRepository.checkProductsAvailability(cartProducts)

      // Assert
      expect(result).toBeDefined()
      expect(result.availableProducts).toHaveLength(1)
      expect(result.unavailableProducts).toHaveLength(1)
      expect(result.total).toBe(1000) // 10 * 100 = 1000
      expect(result.availableProducts[0].product.toString()).toBe(productId1.toString())
      expect(result.unavailableProducts[0].product.toString()).toBe(productId2.toString())
      expect(result.unavailableProducts[0].available).toBe(5)
    })

    it('should handle non-existent products', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId()
      const cartProducts = [
        {
          product: nonExistentId,
          quantity: 1
        }
      ]

      // Act
      const result = await ticketRepository.checkProductsAvailability(cartProducts)

      // Assert
      expect(result).toBeDefined()
      expect(result.availableProducts).toHaveLength(0)
      expect(result.unavailableProducts).toHaveLength(1)
      expect(result.unavailableProducts[0].available).toBe(0)
      expect(logger.warn).toHaveBeenCalled()
    })
  })

  describe('findByPurchaser', () => {
    it('should find tickets by purchaser email', async () => {
      // Arrange
      const purchaserEmail = 'test-find@example.com'
      await ticketRepository.createTicket(
        purchaserEmail,
        [{ product: productId1, quantity: 1, price: 100 }],
        100
      )
      await ticketRepository.createTicket(
        purchaserEmail,
        [{ product: productId2, quantity: 1, price: 200 }],
        200
      )

      // Act
      const tickets = await ticketRepository.findByPurchaser(purchaserEmail)

      // Assert
      expect(tickets).toHaveLength(2)
      expect(tickets[0].purchaser).toBe(purchaserEmail)
      expect(tickets[1].purchaser).toBe(purchaserEmail)
    })
  })

  describe('getStatistics', () => {
    it('should return purchase statistics', async () => {
      // Arrange - create some tickets
      await ticketRepository.createTicket(
        'stats-test@example.com',
        [{ product: productId1, quantity: 1, price: 100 }],
        100
      )

      await ticketRepository.createTicket(
        'stats-test@example.com',
        [{ product: productId1, quantity: 2, price: 100 }],
        200
      )

      const unavailableProducts = [{ product: productId2, quantity: 10, available: 5 }]
      await ticketRepository.createTicket(
        'stats-test@example.com',
        [{ product: productId1, quantity: 1, price: 100 }],
        100,
        unavailableProducts
      )

      // Act
      const statistics = await ticketRepository.getStatistics()

      // Assert
      expect(statistics).toBeDefined()
      expect(statistics.totalTickets).toBeGreaterThanOrEqual(3)
      expect(statistics.completeTickets).toBeGreaterThanOrEqual(2)
      expect(statistics.incompleteTickets).toBeGreaterThanOrEqual(1)
      expect(statistics.totalRevenue).toBeGreaterThanOrEqual(300)
      expect(statistics.completionRate).toBeDefined()
      expect(statistics.recentPurchases).toBeDefined()
      expect(statistics.recentPurchases.length).toBeGreaterThanOrEqual(3)
    })
  })
})
