import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { MailService } from '../src/services/mail.service.js'
import { jest, describe, beforeAll, afterAll, afterEach, it, expect } from '@jest/globals'

// Mock the mail service to avoid sending actual emails during tests
jest.mock('../src/services/mail.service.js')

describe('Password Reset Tests', () => {
  let mongoServer
  let resetToken
  let originalMailSendPasswordResetEmail

  // Setup before all tests
  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)

    // Save the original implementation
    originalMailSendPasswordResetEmail = MailService.prototype.sendPasswordResetEmail

    // Mock the mail service
    MailService.prototype.sendPasswordResetEmail = jest.fn().mockImplementation(async (email, resetLink) => {
      // Extract token from resetLink for testing
      const urlParts = resetLink.split('/')
      resetToken = urlParts[urlParts.length - 1]
      return true
    })

    // Create a test user
    await UserModel.create({
      first_name: 'Test',
      last_name: 'User',
      email: 'test.reset@example.com',
      age: 30,
      password: 'Password123'
    })
  }, 60000)

  // Cleanup after all tests
  afterAll(async () => {
    // Restore original mail service
    MailService.prototype.sendPasswordResetEmail = originalMailSendPasswordResetEmail

    // Clean up
    await mongoose.disconnect()
    await mongoServer.stop()
  }, 60000)

  // Cleanup after each test
  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('should request a password reset and send email', async () => {
    const response = await request(app)
      .post('/api/sessions/forgot-password')
      .send({ email: 'test.reset@example.com' })
      .expect(200)

    expect(response.body.status).toBe('success')
    expect(response.body.message).toContain('have been sent')
    expect(MailService.prototype.sendPasswordResetEmail).toHaveBeenCalled()
    expect(resetToken).toBeDefined()
  }, 10000)

  it('should return success for non-existent email without revealing user existence', async () => {
    const response = await request(app)
      .post('/api/sessions/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200)

    expect(response.body.status).toBe('success')
    expect(response.body.message).toContain('If your email is registered')
    expect(MailService.prototype.sendPasswordResetEmail).not.toHaveBeenCalled()
  }, 10000)

  it('should verify a valid reset token', async () => {
    // First request a reset
    await request(app)
      .post('/api/sessions/forgot-password')
      .send({ email: 'test.reset@example.com' })

    // Then verify the token
    const response = await request(app)
      .get(`/api/sessions/reset-password/${resetToken}`)
      .expect(200)

    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('Token is valid')
    expect(response.body.email).toBe('test.reset@example.com')
  }, 10000)

  it('should reject invalid reset tokens', async () => {
    const response = await request(app)
      .get('/api/sessions/reset-password/invalid-token')
      .expect(400)

    expect(response.body.status).toBe('error')
    expect(response.body.message).toContain('invalid or has expired')
  }, 10000)

  it('should reset password with valid token', async () => {
    // First request a reset
    await request(app)
      .post('/api/sessions/forgot-password')
      .send({ email: 'test.reset@example.com' })

    // Then reset the password
    const response = await request(app)
      .post(`/api/sessions/reset-password/${resetToken}`)
      .send({ password: 'NewPassword456' })
      .expect(200)

    expect(response.body.status).toBe('success')
    expect(response.body.message).toContain('successfully reset')

    // Verify we can login with new password
    const loginResponse = await request(app)
      .post('/api/sessions/login')
      .send({
        email: 'test.reset@example.com',
        password: 'NewPassword456'
      })
      .expect(200)

    expect(loginResponse.body.status).toBe('success')
  }, 10000)

  it('should prevent using the same password', async () => {
    // First request a reset
    await request(app)
      .post('/api/sessions/forgot-password')
      .send({ email: 'test.reset@example.com' })

    // Then try to reset with the same password
    const response = await request(app)
      .post(`/api/sessions/reset-password/${resetToken}`)
      .send({ password: 'NewPassword456' })
      .expect(400)

    expect(response.body.status).toBe('error')
    expect(response.body.message).toContain('cannot be the same')
  }, 10000)
})
