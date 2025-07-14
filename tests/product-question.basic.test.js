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
let userId = ''
let adminId = ''
let testProductId = ''
let testQuestionId = ''

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})

  // Crear usuario regular para pruebas
  const user = await UserModel.create({
    first_name: 'Regular',
    last_name: 'User',
    email: 'user@test.com',
    age: 25,
    password: 'testpassword',
    role: 'user'
  })
  userId = user._id.toString()

  // Crear usuario admin para pruebas
  const admin = await UserModel.create({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
    age: 30,
    password: 'testpassword',
    role: 'admin'
  })
  adminId = admin._id.toString()

  // Generar token JWT para el usuario regular
  userToken = jwt.sign(
    { id: userId, email: 'user@test.com', role: 'user' },
    config.SECRET,
    { expiresIn: '1h' }
  )

  // Generar token JWT para el admin
  adminToken = jwt.sign(
    { id: adminId, email: 'admin@test.com', role: 'admin' },
    config.SECRET,
    { expiresIn: '1h' }
  )

  // Crear un producto para pruebas
  const product = await ProductModel.create({
    name: 'Test Product',
    description: 'This is a test product for question tests',
    price: 999,
    stock: 50,
    category: 'test'
  })
  testProductId = product._id.toString()

  // Crear una pregunta para pruebas
  const question = await ProductQuestionModel.create({
    product: testProductId,
    user: userId,
    question: 'Is this product compatible with my device?'
  })
  testQuestionId = question._id.toString()
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('Product Question API Basic Tests', () => {
  test('Can get questions for a product', async () => {
    const response = await request(app)
      .get(`/api/product-questions/product/${testProductId}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.payload)).toBe(true)
    expect(response.body.payload.length).toBeGreaterThan(0)
  }, 30000)

  test('User can get their own questions', async () => {
    const response = await request(app)
      .get('/api/product-questions/user')
      .set('Authorization', `Bearer ${userToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.payload)).toBe(true)
    expect(response.body.payload.length).toBeGreaterThan(0)
  }, 30000)

  test('Admin can access unanswered questions', async () => {
    const response = await request(app)
      .get('/api/product-questions/unanswered')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.payload)).toBe(true)
  }, 30000)

  test('Admin can answer a question', async () => {
    const response = await request(app)
      .post(`/api/product-questions/${testQuestionId}/answer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        answer: 'Yes, this product is compatible with all standard devices.'
      })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.payload).toHaveProperty('answer')
    expect(response.body.payload.answer).toBe('Yes, this product is compatible with all standard devices.')
  }, 30000)

  test('User cannot answer questions', async () => {
    const response = await request(app)
      .post(`/api/product-questions/${testQuestionId}/answer`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        answer: 'This should not work'
      })

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  }, 30000)
})
