import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import { CartModel } from '../src/models/cart.model.js'
import { OrderModel } from '../src/models/order.model.js'
import { ProductQuestionModel } from '../src/models/product-question.model.js'
import jwt from 'jsonwebtoken'
import config from '../src/config/index.js'
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'

// Variables para almacenar datos entre pruebas
let adminToken = ''
let userToken = ''
let testProductId = ''
let cartId = ''
let userId = ''
let orderId = ''

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await CartModel.deleteMany({})
  await OrderModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})

  // Crear usuario regular para pruebas
  const user = await UserModel.create({
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    age: 30,
    password: 'password123',
    role: 'user'
  })
  userId = user._id.toString()

  // Crear usuario admin
  await UserModel.create({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    age: 35,
    password: 'admin123',
    role: 'admin'
  })

  // Generar tokens
  userToken = jwt.sign(
    { id: userId, email: 'test@example.com', role: 'user' },
    config.SECRET,
    { expiresIn: '1h' }
  )

  adminToken = jwt.sign(
    { id: '000000000000000000000001', email: 'admin@example.com', role: 'admin' },
    config.SECRET,
    { expiresIn: '1h' }
  )
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await CartModel.deleteMany({})
  await OrderModel.deleteMany({})
  await ProductQuestionModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('E-commerce Integration Tests', () => {
  test('End-to-end purchase flow with product questions', async () => {
    // 1. Admin crea un producto
    const createProductResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Smartphone XYZ',
        description: 'High-end smartphone with amazing features',
        price: 799,
        stock: 100,
        category: 'electronics'
      })

    expect(createProductResponse.status).toBe(201)
    testProductId = createProductResponse.body.product._id

    // 2. Usuario hace una pregunta sobre el producto
    const askQuestionResponse = await request(app)
      .post('/api/product-questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: testProductId,
        question: '¿Este teléfono es compatible con redes 5G?'
      })

    expect(askQuestionResponse.status).toBe(201)
    const questionId = askQuestionResponse.body.payload._id

    // 3. Admin responde la pregunta
    const answerQuestionResponse = await request(app)
      .post(`/api/product-questions/${questionId}/answer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        answer: 'Sí, este teléfono es totalmente compatible con todas las redes 5G disponibles actualmente.'
      })

    expect(answerQuestionResponse.status).toBe(200)
    expect(answerQuestionResponse.body.payload.answer).toBe(
      'Sí, este teléfono es totalmente compatible con todas las redes 5G disponibles actualmente.'
    )

    // 4. Usuario crea un carrito
    const createCartResponse = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${userToken}`)

    expect(createCartResponse.status).toBe(201)
    cartId = createCartResponse.body.payload._id

    // 5. Usuario agrega el producto al carrito
    const addToCartResponse = await request(app)
      .post(`/api/cart/${cartId}/product/${testProductId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 })

    expect(addToCartResponse.status).toBe(200)
    expect(addToCartResponse.body.payload.products).toHaveLength(1)
    expect(addToCartResponse.body.payload.products[0].product._id).toBe(testProductId)

    // 6. Usuario crea una orden con el carrito
    const createOrderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cartItems: [
          {
            product: {
              _id: testProductId,
              name: 'Smartphone XYZ',
              price: 799
            },
            quantity: 1
          }
        ],
        totalAmount: 799,
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
      })

    expect(createOrderResponse.status).toBe(201)
    orderId = createOrderResponse.body.payload._id

    // 7. El usuario verifica su orden
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(getOrderResponse.status).toBe(200)
    expect(getOrderResponse.body.payload._id).toBe(orderId)
    expect(getOrderResponse.body.payload.status).toBe('pending')

    // 8. Admin cambia el estado de la orden a "processing"
    const updateOrderStatusResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' })

    expect(updateOrderStatusResponse.status).toBe(200)
    expect(updateOrderStatusResponse.body.payload.status).toBe('processing')

    // 9. Admin cambia el estado de la orden a "shipped"
    const updateToShippedResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' })

    expect(updateToShippedResponse.status).toBe(200)
    expect(updateToShippedResponse.body.payload.status).toBe('shipped')

    // 10. Admin cambia el estado de la orden a "delivered"
    const updateToDeliveredResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' })

    expect(updateToDeliveredResponse.status).toBe(200)
    expect(updateToDeliveredResponse.body.payload.status).toBe('delivered')

    // 11. El usuario verifica que el estado final de su orden es "delivered"
    const finalOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(finalOrderResponse.status).toBe(200)
    expect(finalOrderResponse.body.payload.status).toBe('delivered')
  }, 60000)

  test('Admin can view all unanswered product questions', async () => {
    // 1. Crear un producto nuevo para este test
    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Laptop ABC',
        description: 'Professional laptop for developers',
        price: 1299,
        stock: 50,
        category: 'electronics'
      })

    const newProductId = productResponse.body.product._id

    // 2. Usuario hace múltiples preguntas sin respuesta
    await request(app)
      .post('/api/product-questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: newProductId,
        question: '¿Qué sistema operativo viene preinstalado?'
      })

    await request(app)
      .post('/api/product-questions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: newProductId,
        question: '¿Cuál es el tiempo de duración de la batería?'
      })

    // 3. Admin verifica las preguntas sin responder
    const unansweredResponse = await request(app)
      .get('/api/product-questions/unanswered')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(unansweredResponse.status).toBe(200)
    expect(unansweredResponse.body.payload.length).toBeGreaterThanOrEqual(2)
    // Verificar que todas las preguntas devueltas no tienen respuesta
    unansweredResponse.body.payload.forEach(question => {
      expect(question.answer).toBeUndefined()
    })
  }, 60000)

  test('Admin can view all orders and filter by status', async () => {
    // 1. Crear una orden adicional con estado "cancelled"
    await OrderModel.create({
      user: userId,
      products: [
        {
          product: testProductId,
          quantity: 1
        }
      ],
      totalAmount: 799,
      status: 'cancelled',
      shippingAddress: {
        street: '456 Oak St',
        city: 'Córdoba',
        state: 'CBA',
        postalCode: '5000',
        country: 'Argentina'
      }
    })

    // 2. Admin verifica todas las órdenes
    const allOrdersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(allOrdersResponse.status).toBe(200)
    expect(allOrdersResponse.body.payload.length).toBeGreaterThanOrEqual(2)

    // 3. Admin filtra por estado "cancelled"
    const cancelledOrdersResponse = await request(app)
      .get('/api/orders?status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(cancelledOrdersResponse.status).toBe(200)
    expect(cancelledOrdersResponse.body.payload.length).toBeGreaterThanOrEqual(1)
    
    // Verificar que todas las órdenes devueltas tienen estado "cancelled"
    cancelledOrdersResponse.body.payload.forEach(order => {
      expect(order.status).toBe('cancelled')
    })
    
    // 4. Admin filtra por estado "delivered"
    const deliveredOrdersResponse = await request(app)
      .get('/api/orders?status=delivered')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(deliveredOrdersResponse.status).toBe(200)
    expect(deliveredOrdersResponse.body.payload.length).toBeGreaterThanOrEqual(1)
    
    // Verificar que todas las órdenes devueltas tienen estado "delivered"
    deliveredOrdersResponse.body.payload.forEach(order => {
      expect(order.status).toBe('delivered')
    })
  }, 60000)
})
