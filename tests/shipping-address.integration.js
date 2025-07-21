import request from 'supertest'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { ShippingAddressModel } from '../src/models/shipping-address.model.js'
import { OrderModel } from '../src/models/order.model.js'
import { beforeAll, afterAll, beforeEach, afterEach, describe, test, expect } from '@jest/globals'
import { setupTestDB, closeTestDB } from './setup.js'

// Test user data
const testUser = {
  first_name: 'Address',
  last_name: 'Tester',
  email: 'address.tester@test.com',
  age: 30,
  password: 'password123',
  role: 'guest' // Iniciamos como 'guest' para probar la promoción a 'user'
}

// Test address data
const testAddress = {
  state: 'California',
  street: '123 Main St',
  postalCode: '90001',
  country: 'USA',
  apt: 101,
  locality: 'Los Angeles',
  details: 'Near the park',
  isDefault: true
}

let userToken
let userId

describe('Shipping Address Integration Tests', () => {
  // Configure test environment
  beforeAll(async () => {
    // Setup test database
    await setupTestDB()
    // Clean collections
    await UserModel.deleteMany({})
    await ShippingAddressModel.deleteMany({})
    await OrderModel.deleteMany({})
  }, 60000)

  afterAll(async () => {
    await closeTestDB()
  }, 60000)

  // Create test user before each test
  beforeEach(async () => {
    // Create test user
    const user = await UserModel.create({
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      email: testUser.email,
      age: testUser.age,
      password: testUser.password,
      role: testUser.role
    })
    userId = user._id.toString()

    // Login as test user
    const userLoginResponse = await request(app)
      .post('/api/sessions/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
    userToken = userLoginResponse.body.token
  })

  // Clean up after each test
  afterEach(async () => {
    await UserModel.deleteMany({})
    await ShippingAddressModel.deleteMany({})
  })

  test('should create a new shipping address and promote user role', async () => {
    const response = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testAddress).expect(201)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('address')
    
    // Verify user role promotion from 'guest' to 'user'
    const updatedUser = await UserModel.findById(userId)
    expect(updatedUser.role).toBe('user')
  }, 30000)

  test('should get all addresses for the user', async () => {
    // First, create an address
    await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testAddress)
    const response = await request(app)
      .get('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
    
    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('addresses')
    expect(Array.isArray(response.body.addresses)).toBe(true)
    expect(response.body.addresses.length).toBeGreaterThan(0)
  }, 30000)
  
  test('should set address as default', async () => {
    // Create a default address
    const firstAddressResponse = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...testAddress,
        isDefault: true
      })
    
    const firstAddressId = firstAddressResponse.body.address._id
    
    // Create a second non-default address
    const secondAddressResponse = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...testAddress,
        street: '789 Second St',
        isDefault: false
      })
    
    const secondAddressId = secondAddressResponse.body.address._id
    
    // Set second address as default
    const response = await request(app)
      .post(`/api/shipping-addresses/${secondAddressId}/default`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
    
    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('address')
    expect(response.body.address).toHaveProperty('is_default', true)
    
    // Verify first address is no longer default
    const firstAddressCheck = await ShippingAddressModel.findById(firstAddressId)
    expect(firstAddressCheck.is_default).toBe(false)
  }, 30000)
})
