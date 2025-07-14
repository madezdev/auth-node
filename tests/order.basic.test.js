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
let userId = ''
let adminId = ''
let testProductId = ''

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})

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

  // Crear carrito para el usuario
  const cart = await CartModel.create({ user: userId })
  
  // Actualizar usuario con referencia al carrito
  await UserModel.findByIdAndUpdate(userId, { cart: cart._id })

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
    description: 'This is a test product for order tests',
    price: 999,
    stock: 50,
    category: 'test'
  })
  testProductId = product._id.toString()
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await OrderModel.deleteMany({})
  await CartModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('Order API Basic Tests', () => {
  test('Admin can get all orders', async () => {
    // Crear una orden para el test
    const order = await OrderModel.create({
      user: userId,
      products: [
        {
          product: testProductId,
          name: 'Test Product',
          price: 999,
          quantity: 1
        }
      ],
      totalAmount: 999,
      status: 'pending',
      code: 'TEST-123',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Testland'
      },
      paymentInfo: {
        method: 'credit_card'
      }
    })

    // Admin accede a todas las órdenes
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.payload)).toBe(true)
    expect(response.body.payload.length).toBeGreaterThan(0)
  }, 30000)

  test('User can get their own orders', async () => {
    // Usuario accede a sus órdenes
    const response = await request(app)
      .get('/api/orders/user')
      .set('Authorization', `Bearer ${userToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.payload)).toBe(true)
  }, 30000)

  test('User cannot access admin-only endpoints', async () => {
    // Usuario intenta acceder al endpoint de admin
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  }, 30000)
})
