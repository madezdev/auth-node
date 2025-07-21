import request from 'supertest'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { CartModel } from '../src/models/cart.model.js'
import { ProductModel } from '../src/models/product.model.js'
import { beforeAll, afterAll, describe, test, expect } from '@jest/globals'
import { setupTestDB, closeTestDB } from './setup.js'

// Test user data
const testUser = {
  first_name: 'Cart',
  last_name: 'Tester',
  email: 'cart.tester@test.com',
  birthday: new Date('1990-01-01'),
  identifier: 12345678,
  tax_identifier: 87654321,
  phone: '+1234567890',
  password: 'password123'
}

// Test product data
let testProduct

let userToken
let cartId

// Connect to test database before running tests
beforeAll(async () => {
  // Configurar la conexión a la base de datos
  await setupTestDB()

  // Clean existing test data
  await UserModel.deleteMany({ email: testUser.email })
  await CartModel.deleteMany({})
  await ProductModel.deleteMany({ title: 'Test Product' })

  // Create a test product in the database
  testProduct = await ProductModel.create({
    slug: 'test-product-cart',
    title: 'Test Product',
    description: 'Test product description',
    brand: 'Test Brand',
    model: 'Test Model',
    origin: 'Test Origin',
    price: {
      price: 99.99,
      iva: 21,
      isOffer: false
    },
    imagePath: ['test-image.jpg'],
    thumbnail: 'test-thumbnail.jpg',
    code: 'TEST001',
    stock: 50,
    category: 'other',
    active: true,
    isActive: true
  })

  // Register a test user
  const registerResponse = await request(app)
    .post('/api/sessions/register')
    .send(testUser)

  userToken = registerResponse.body.token
}, 60000) // Incrementar timeout a 60 segundos

// Disconnect from database after all tests
afterAll(async () => {
  // Clean up created test data before closing connection
  try {
    await UserModel.deleteMany({ email: testUser.email })
    if (testProduct && testProduct._id) {
      await ProductModel.deleteMany({ _id: testProduct._id })
    }
  } catch (error) {
    console.log('Error cleaning up test data:', error.message)
  }
  await closeTestDB()
}, 60000) // Incrementar timeout a 60 segundos

describe('Cart API', () => {
  test('should create a new cart', async () => {
    const response = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('products')
    expect(Array.isArray(response.body.products)).toBe(true)
    expect(response.body.products.length).toBe(0)

    cartId = response.body.id
  })

  test('should get cart by ID', async () => {
    const response = await request(app)
      .get(`/api/cart/${cartId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('id', cartId)
    expect(Array.isArray(response.body.products)).toBe(true)
  })

  test('should add a product to the cart', async () => {
    const response = await request(app)
      .post(`/api/cart/${cartId}/products/${testProduct._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 2 })
      .expect(200)

    expect(response.body).toHaveProperty('id', cartId)
    expect(response.body.products.length).toBe(1)
    expect(response.body.products[0].quantity).toBe(2)
    expect(response.body.products[0].product.toString()).toBe(testProduct._id.toString())
  })

  test('should update product quantity in cart', async () => {
    const response = await request(app)
      .put(`/api/cart/${cartId}/products/${testProduct._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 })
      .expect(200)

    expect(response.body).toHaveProperty('id', cartId)
    expect(response.body.products.length).toBe(1)
    expect(response.body.products[0].quantity).toBe(5)
  })

  test('should remove a product from cart', async () => {
    const response = await request(app)
      .delete(`/api/cart/${cartId}/products/${testProduct._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('id', cartId)
    expect(response.body.products.length).toBe(0)
  })

  test('should empty the cart', async () => {
    // First add a product to the cart
    const addResponse = await request(app)
      .post(`/api/cart/${cartId}/products/${testProduct._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 })

    // Verificar que la adición fue exitosa
    expect(addResponse.status).toBe(200)

    // Then empty the cart
    const response = await request(app)
      .delete(`/api/cart/${cartId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('_id', cartId)
    expect(response.body.products.length).toBe(0)
  })

  test('should process cart checkout', async () => {
    // Add product to cart for checkout
    const addResponse = await request(app)
      .post(`/api/cart/${cartId}/products/${testProduct._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 })

    // Verificar que la adición fue exitosa
    expect(addResponse.status).toBe(200)

    // Process checkout
    const response = await request(app)
      .post(`/api/cart/${cartId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message', 'Checkout procesado correctamente')
    expect(response.body).toHaveProperty('orderId')
    expect(response.body).toHaveProperty('order')

    // Check that cart is now empty
    const cartResponse = await request(app)
      .get(`/api/cart/${cartId}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(cartResponse.body.products.length).toBe(0)
  })
})
