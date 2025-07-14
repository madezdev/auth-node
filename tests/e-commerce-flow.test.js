import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import { OrderModel } from '../src/models/order.model.js'
import { CartModel } from '../src/models/cart.model.js'
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
let cartId = ''
let orderId = ''
let questionId = ''

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})
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
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('E-commerce Flow Tests', () => {
  test('Complete e-commerce flow', async () => {
    // 1. Admin crea un producto
    const createProductResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Smart TV',
        description: 'Ultra HD Smart TV with amazing features',
        price: 1299,
        stock: 20,
        category: 'electronics'
      })

    expect(createProductResponse.status).toBe(201)
    expect(createProductResponse.body.product).toHaveProperty('_id')
    testProductId = createProductResponse.body.product._id

    // 2. Usuario hace una pregunta sobre el producto
    const questionResponse = await request(app)
      .post('/api/product-questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: testProductId,
        question: '¿Este televisor incluye soporte para montaje en pared?'
      })

    expect(questionResponse.status).toBe(201)
    expect(questionResponse.body.payload).toHaveProperty('id')
    questionId = questionResponse.body.payload.id

    // 3. Admin responde la pregunta
    const answerResponse = await request(app)
      .post(`/api/product-questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        answer: 'No, el soporte para pared se vende por separado, pero es compatible con cualquier soporte VESA estándar.'
      })

    expect(answerResponse.status).toBe(200)
    expect(answerResponse.body.payload).toHaveProperty('answer')

    // 4. Crear carrito para el usuario
    const cartResponse = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${userToken}`)

    expect(cartResponse.status).toBe(201)
    expect(cartResponse.body).toHaveProperty('_id')
    cartId = cartResponse.body._id

    // 5. Agregar el producto al carrito
    const addToCartResponse = await request(app)
      .post(`/api/cart/${cartId}/products/${testProductId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 })

    expect(addToCartResponse.status).toBe(200)

    // 6. Crear orden a partir del carrito
    const orderData = {
      cartItems: [
        {
          product: {
            _id: testProductId,
            name: 'Smart TV',
            price: 1299
          },
          quantity: 1
        }
      ],
      totalAmount: 1299,
      shippingAddress: {
        street: '123 Main St',
        city: 'Buenos Aires',
        state: 'CABA',
        postalCode: '1000',
        country: 'Argentina'
      },
      paymentInfo: {
        method: 'credit_card',
        transactionId: 'txn_123456789'
      }
    }

    const orderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(orderData)

    expect(orderResponse.status).toBe(201)
    expect(orderResponse.body.payload).toHaveProperty('id')
    orderId = orderResponse.body.payload.id

    // 7. Verificar órdenes del usuario
    const userOrdersResponse = await request(app)
      .get('/api/orders/user')
      .set('Authorization', `Bearer ${userToken}`)

    expect(userOrdersResponse.status).toBe(200)
    expect(userOrdersResponse.body.payload.length).toBeGreaterThan(0)

    // 8. Admin actualiza estado de la orden a "processing"
    const updateToProcessingResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' })

    // El test podría fallar si hay problemas con el servicio de email durante pruebas
    // pero lo importante es que el endpoint responda
    expect(updateToProcessingResponse.status).toBe(200)

    // 9. Admin consulta todas las órdenes
    const allOrdersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(allOrdersResponse.status).toBe(200)
    expect(allOrdersResponse.body.status).toBe('success')
    expect(Array.isArray(allOrdersResponse.body.payload)).toBe(true)
    expect(allOrdersResponse.body.payload.length).toBeGreaterThan(0)

    // 10. Admin verifica preguntas sin responder
    const unansweredResponse = await request(app)
      .get('/api/product-questions/unanswered')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(unansweredResponse.status).toBe(200)
    expect(unansweredResponse.body.status).toBe('success')
    // La pregunta ya fue respondida en el paso 3
    expect(unansweredResponse.body.payload.some(q => q.id === questionId)).toBe(false)
  }, 60000)
})
