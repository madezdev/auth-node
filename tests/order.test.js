import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import { OrderModel } from '../src/models/order.model.js'
import { CartModel } from '../src/models/cart.model.js'
import jwt from 'jsonwebtoken'
import config from '../src/config/index.js'
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'

// Variables para almacenar datos entre pruebas
let adminToken = ''
let userToken = ''
let testOrderId = ''
let adminId = ''
let userId = ''
let testProductId = ''

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
  description: 'This is a test product for order tests',
  price: 999,
  stock: 50,
  category: 'test'
}

const testOrder = {
  cartItems: [], // Will be filled after product creation
  totalAmount: 999,
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'Testland'
  },
  paymentInfo: {
    method: 'credit_card',
    transactionId: 'test_transaction_123'
  }
}

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})

  // Crear usuario regular para pruebas
  const user = await UserModel.create(testUser)
  userId = user._id.toString()

  // Crear usuario admin para pruebas
  const admin = await UserModel.create(testAdmin)
  adminId = admin._id.toString()

  // Crear carrito para el usuario
  const cart = await CartModel.create({ user: userId })
  
  // Actualizar usuario con referencia al carrito
  await UserModel.findByIdAndUpdate(userId, { cart: cart._id })

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
  
  // Actualizar testOrder con el producto creado
  testOrder.cartItems = [
    {
      product: {
        _id: testProductId,
        name: testProduct.name,
        price: testProduct.price
      },
      quantity: 1
    }
  ]
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('Order API Tests', () => {
  describe('POST /api/orders', () => {
    test('should create a new order when authenticated', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testOrder)

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.payload).toHaveProperty('id')
      expect(response.body.payload).toHaveProperty('totalAmount')
      expect(response.body.payload).toHaveProperty('products')
      expect(response.body.payload.totalAmount).toBe(testOrder.totalAmount)

      // Guardar ID para pruebas posteriores
      testOrderId = response.body.payload.id
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(testOrder)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 400 when cart items are missing', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          totalAmount: 999,
          shippingAddress: testOrder.shippingAddress,
          paymentInfo: testOrder.paymentInfo
          // cartItems missing
        })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/orders/user', () => {
    test('should get all orders for current user', async () => {
      // Asegurarnos de que tenemos al menos una orden
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      expect(response.body.payload.length).toBeGreaterThan(0)
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/orders/user')

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/orders/:orderId', () => {
    test('should get a specific order by id for the owner', async () => {
      // Asegurarnos de que tenemos un ID válido para consultar
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.payload).toHaveProperty('_id')
      expect(response.body.payload._id).toBe(testOrderId)
    }, 30000)

    test('should allow admin to view any order', async () => {
      // Asegurarnos de que tenemos un ID válido para consultar
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.payload).toHaveProperty('_id')
      expect(response.body.payload._id).toBe(testOrderId)
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      // Asegurarnos de que tenemos un ID válido
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 404 for non-existent order', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .get(`/api/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/orders (Admin endpoint)', () => {
    test('should allow admin to get all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
    }, 30000)

    test('should allow admin to filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      
      // All returned orders should have the requested status
      if (response.body.payload.length > 0) {
        response.body.payload.forEach(order => {
          expect(order.status).toBe('pending')
        })
      }
    }, 30000)

    test('should deny access to regular users', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('PATCH /api/orders/:orderId/status (Admin endpoint)', () => {
    test('should allow admin to update order status', async () => {
      // Asegurarnos de que tenemos un ID válido
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .patch(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.payload.status).toBe('processing')
    }, 30000)

    test('should deny access to regular users', async () => {
      // Asegurarnos de que tenemos un ID válido
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .patch(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'delivered' })

      expect(response.status).toBe(403)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 400 for invalid status', async () => {
      // Asegurarnos de que tenemos un ID válido
      if (!testOrderId) {
        const createResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testOrder)

        testOrderId = createResponse.body.payload.id
      }

      const response = await request(app)
        .patch(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 404 for non-existent order', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .patch(`/api/orders/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
    }, 30000)
  })
})
