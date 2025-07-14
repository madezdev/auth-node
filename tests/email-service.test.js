import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { setupTestDB, closeTestDB } from './setup.js'
import { EmailService } from '../src/services/email.service.js'

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions) => {
      return Promise.resolve({
        messageId: 'test-message-id',
        envelope: {
          from: mailOptions.from,
          to: [mailOptions.to]
        }
      })
    })
  })
}))

// Sample test data
const testOrder = {
  _id: '123456789012345678901234',
  orderNumber: 'ORD-12345',
  user: {
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  },
  products: [
    {
      product: {
        _id: '234567890123456789012345',
        name: 'Test Product',
        price: 999
      },
      quantity: 2
    }
  ],
  totalAmount: 1998,
  createdAt: new Date(),
  status: 'processing'
}

describe('EmailService Tests', () => {
  let emailService
  
  beforeEach(async () => {
    await setupTestDB()
    emailService = new EmailService()
  })

  afterEach(async () => {
    await closeTestDB()
  })
  
  describe('sendOrderStatusUpdate', () => {
    test('should send order status update email for processing status', async () => {
      // Set order status for this test
      const order = { ...testOrder, status: 'processing' }
      
      // Call the method to test
      const result = await emailService.sendOrderStatusUpdate(order)
      
      // Assertions
      expect(result).toBeDefined()
      expect(result.messageId).toBe('test-message-id')
      expect(result.envelope.to[0]).toBe(order.user.email)
      
      // Verify that the subject contains the order status
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('processing'),
          html: expect.stringContaining('processing')
        })
      )
    })
    
    test('should send order status update email for shipped status', async () => {
      // Set order status for this test
      const order = { ...testOrder, status: 'shipped' }
      
      // Call the method to test
      const result = await emailService.sendOrderStatusUpdate(order)
      
      // Assertions
      expect(result).toBeDefined()
      expect(result.messageId).toBe('test-message-id')
      expect(result.envelope.to[0]).toBe(order.user.email)
      
      // Verify that the subject contains the order status and tracking link
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('shipped'),
          html: expect.stringContaining('shipped')
        })
      )
    })
    
    test('should send order status update email for delivered status with feedback request', async () => {
      // Set order status for this test
      const order = { ...testOrder, status: 'delivered' }
      
      // Call the method to test
      const result = await emailService.sendOrderStatusUpdate(order)
      
      // Assertions
      expect(result).toBeDefined()
      expect(result.messageId).toBe('test-message-id')
      expect(result.envelope.to[0]).toBe(order.user.email)
      
      // Verify that the email contains feedback request
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('delivered'),
          html: expect.stringContaining('feedback')
        })
      )
    })
    
    test('should send order status update email for cancelled status', async () => {
      // Set order status for this test
      const order = { ...testOrder, status: 'cancelled' }
      
      // Call the method to test
      const result = await emailService.sendOrderStatusUpdate(order)
      
      // Assertions
      expect(result).toBeDefined()
      expect(result.messageId).toBe('test-message-id')
      expect(result.envelope.to[0]).toBe(order.user.email)
      
      // Verify that the email contains cancellation details
      expect(emailService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('cancelled'),
          html: expect.stringContaining('cancelled')
        })
      )
    })
    
    test('should handle missing user email gracefully', async () => {
      // Create order with missing user email
      const orderWithoutEmail = {
        ...testOrder,
        user: { first_name: 'Test', last_name: 'User' }
      }
      
      // Test and expect rejection
      await expect(
        emailService.sendOrderStatusUpdate(orderWithoutEmail)
      ).rejects.toThrow()
    })
  })
})
