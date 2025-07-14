import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import { ProductQuestionModel } from '../src/models/product-question.model.js'
import jwt from 'jsonwebtoken'
import config from '../src/config/index.js'
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'

// Variables para almacenar datos entre pruebas
let adminToken = ''
let userToken = ''
let testProductId = ''
let testQuestionId = ''
let adminId = ''
let userId = ''

// Datos para pruebas
const testUser = {
  first_name: 'Regular',
  last_name: 'User',
  email: 'user@test.com',
  age: 25,
  password: 'testpassword',
  role: 'user'
}

const testAdmin = {
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@test.com',
  age: 30,
  password: 'testpassword',
  role: 'admin'
}

const testProduct = {
  name: 'Test Product',
  description: 'This is a test product for question tests',
  price: 999,
  stock: 50,
  category: 'test'
}

const testQuestion = {
  question: 'Is this product compatible with my device?'
}

const testAnswer = {
  answer: 'Yes, this product is compatible with all standard devices.'
}

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})

  // Crear usuario regular para pruebas
  const user = await UserModel.create(testUser)
  userId = user._id.toString()

  // Crear usuario admin para pruebas
  const admin = await UserModel.create(testAdmin)
  adminId = admin._id.toString()

  // Generar token JWT para el usuario regular
  userToken = jwt.sign(
    { id: userId, email: testUser.email, role: testUser.role },
    config.SECRET,
    { expiresIn: '1h' }
  )

  // Generar token JWT para el admin
  adminToken = jwt.sign(
    { id: adminId, email: testAdmin.email, role: testAdmin.role },
    config.SECRET,
    { expiresIn: '1h' }
  )

  // Crear un producto para pruebas
  const product = await ProductModel.create(testProduct)
  testProductId = product._id.toString()
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('Product Question API Tests', () => {
  describe('POST /api/product-questions', () => {
    test('should create a new question when authenticated', async () => {
      const response = await request(app)
        .post('/api/product-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProductId,
          question: testQuestion.question
        })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.payload).toHaveProperty('_id')
      expect(response.body.payload).toHaveProperty('question')
      expect(response.body.payload.question).toBe(testQuestion.question)

      // Guardar ID para pruebas posteriores
      testQuestionId = response.body.payload._id
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/product-questions')
        .send({
          productId: testProductId,
          question: testQuestion.question
        })

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 400 when question is empty', async () => {
      const response = await request(app)
        .post('/api/product-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProductId,
          question: ''
        })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/product-questions/product/:productId', () => {
    test('should get all questions for a specific product', async () => {
      // Asegurarnos de que tenemos al menos una pregunta
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .get(`/api/product-questions/product/${testProductId}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      expect(response.body.payload.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('GET /api/product-questions/user', () => {
    test('should get all questions asked by the current user', async () => {
      // Asegurarnos de que tenemos al menos una pregunta
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .get('/api/product-questions/user')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      expect(response.body.payload.length).toBeGreaterThan(0)
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/product-questions/user')

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/product-questions/unanswered', () => {
    test('should allow admin to get all unanswered questions', async () => {
      // Asegurarnos de que tenemos al menos una pregunta sin respuesta
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .get('/api/product-questions/unanswered')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      
      // All returned questions should not have an answer
      if (response.body.payload.length > 0) {
        response.body.payload.forEach(question => {
          expect(question.answer).toBeUndefined()
        })
      }
    }, 30000)

    test('should deny access to regular users', async () => {
      const response = await request(app)
        .get('/api/product-questions/unanswered')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('POST /api/product-questions/:questionId/answer', () => {
    test('should allow admin to answer a question', async () => {
      // Asegurarnos de que tenemos una pregunta para responder
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .post(`/api/product-questions/${testQuestionId}/answer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testAnswer)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.payload).toHaveProperty('answer')
      expect(response.body.payload.answer).toBe(testAnswer.answer)
      expect(response.body.payload).toHaveProperty('answeredBy')
      expect(response.body.payload).toHaveProperty('answeredAt')
    }, 30000)

    test('should deny access to regular users', async () => {
      // Asegurarnos de que tenemos una pregunta para responder
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .post(`/api/product-questions/${testQuestionId}/answer`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(testAnswer)

      expect(response.status).toBe(403)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 400 when answer is empty', async () => {
      // Asegurarnos de que tenemos una pregunta para responder
      if (!testQuestionId) {
        const createResponse = await request(app)
          .post('/api/product-questions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: testProductId,
            question: testQuestion.question
          })

        testQuestionId = createResponse.body.payload._id
      }

      const response = await request(app)
        .post(`/api/product-questions/${testQuestionId}/answer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answer: '' })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 404 for non-existent question', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .post(`/api/product-questions/${nonExistentId}/answer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testAnswer)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
    }, 30000)
  })
})
