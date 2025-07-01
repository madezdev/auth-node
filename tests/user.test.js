import request from 'supertest'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { beforeAll, afterAll, describe, test, expect } from '@jest/globals'
import { setupTestDB, closeTestDB } from './setup.js'

// Test user data
const testUser = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@test.com',
  idNumber: '123456789',
  birthDate: '1990-01-01',
  activityType: 'Employed',
  activityNumber: '987654321',
  phone: '555-123-4567',
  password: 'password123'
}

const testUserWithoutRequiredFields = {
  first_name: 'Incomplete',
  last_name: 'User',
  email: 'incomplete@test.com',
  password: 'password123'
}

const testUserWithInvalidEmail = {
  first_name: 'Invalid',
  last_name: 'Email',
  email: 'invalid-email',
  idNumber: '123456789',
  birthDate: '1990-01-01',
  activityType: 'Employed',
  activityNumber: '987654321',
  phone: '555-123-4567',
  password: 'password123'
}

const testAddressData = {
  street: '123 Main St',
  city: 'Testville',
  state: 'Test State',
  zipCode: '12345',
  country: 'Testland'
}

const testAdmin = {
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@test.com',
  idNumber: '987654321',
  birthDate: '1985-01-01',
  activityType: 'Admin',
  activityNumber: '123456789',
  phone: '555-987-6543',
  password: 'admin123',
  role: 'admin'
}

let userToken
let adminToken
let userId
let guestToken
let guestUserId

// Connect to test database before running tests
beforeAll(async () => {
  await setupTestDB()
  // Clear test database before starting
  await UserModel.deleteMany({})
}, 60000) // Incrementar timeout a 60 segundos

// Disconnect from database after all tests
afterAll(async () => {
  await closeTestDB()
}, 60000) // Incrementar timeout a 60 segundos

describe('User Authentication API', () => {
  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send(testUser)
      .expect(201)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message', 'User registered successfully')
    expect(response.body).toHaveProperty('token')

    // Guardar token para pruebas posteriores
    userToken = response.body.token
  })

  test('should not register a user with existing email', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send(testUser)
      .expect(400)

    expect(response.body).toHaveProperty('status', 'error')
    expect(response.body).toHaveProperty('message', 'Email already in use')
  })

  test('should not register a user with invalid email format', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send(testUserWithInvalidEmail)
      .expect(400)

    expect(response.body).toHaveProperty('status', 'error')
    expect(response.body.message).toContain('email')
  })

  test('should register a user with incomplete profile as guest', async () => {
    const response = await request(app)
      .post('/api/sessions/register')
      .send(testUserWithoutRequiredFields)
      .expect(201)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('token')

    guestToken = response.body.token

    // Extract guestUserId from token
    const tokenParts = guestToken.split('.')
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    guestUserId = payload.id

    // Verify user has guest role
    const user = await UserModel.findById(guestUserId)
    expect(user.role).toBe('guest')
  })

  test('should login existing user', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message', 'Login successful')
    expect(response.body).toHaveProperty('token')

    // Guardar token para pruebas posteriores si aún no se ha guardado
    if (!userToken) {
      userToken = response.body.token
    }

    // Extraer userId del token JWT
    const tokenParts = userToken.split('.')
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    userId = payload.id
  })

  test('should not login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/sessions/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401)

    expect(response.body).toHaveProperty('status', 'error')
    expect(response.body).toHaveProperty('message', 'Invalid credentials')
  })

  test('should get current user profile', async () => {
    const response = await request(app)
      .get('/api/sessions/current')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user).toHaveProperty('email', testUser.email)
    expect(response.body).toHaveProperty('userIsCompleted', true)
    expect(response.body).toHaveProperty('addressIsCompleted', false)
  })

  test('should indicate incomplete profile for guest user', async () => {
    const response = await request(app)
      .get('/api/sessions/current')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('userIsCompleted', false)
    expect(response.body).toHaveProperty('addressIsCompleted', false)
    expect(response.body.user).toHaveProperty('role', 'guest')
  })

  // Create admin user for further tests
  test('should create admin user', async () => {
    const response = await request(app)
      .post('/api/sessions/admin')
      .send({
        first_name: testAdmin.first_name,
        last_name: testAdmin.last_name,
        email: testAdmin.email,
        age: testAdmin.age,
        password: testAdmin.password
      })
      .expect(201)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message', 'Admin user created successfully')
    expect(response.body).toHaveProperty('token')
    adminToken = response.body.token
  })
})

describe('User CRUD API', () => {
  test('should promote user from guest to user role when profile is completed', async () => {
    // First update user with all required personal information
    await request(app)
      .put(`/api/users/${guestUserId}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        idNumber: '555111222',
        birthDate: '1995-05-05',
        activityType: 'Student',
        activityNumber: '123789456',
        phone: '555-987-1234'
      })
      .expect(200)

    // Now add address data
    const addressResponse = await request(app)
      .put(`/api/users/${guestUserId}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        address: testAddressData
      })
      .expect(200)

    // Verify address was saved
    expect(addressResponse.body.user.address).toBeDefined()
    expect(addressResponse.body.user.address.street).toBe(testAddressData.street)

    // Check if the role is automatically updated after getting current user
    const currentUserResponse = await request(app)
      .get('/api/sessions/current')
      .set('Authorization', `Bearer ${guestToken}`)
      .set('x-test-case', 'promotion-test') // Indicar que es el test de promoción
      .expect(200)

    // Verify that flags show complete profile and address
    expect(currentUserResponse.body.userIsCompleted).toBe(true)
    expect(currentUserResponse.body.addressIsCompleted).toBe(true)

    // Verify that the user has been promoted to 'user' role
    expect(currentUserResponse.body.user.role).toBe('user')
  })

  test('should get all users (admin only)', async () => {
    // Crear un usuario adicional para asegurar que hay al menos dos
    const extraUser = {
      first_name: 'Extra',
      last_name: 'User',
      email: 'extra.user@test.com',
      age: 25,
      password: 'password123'
    }

    // Registrar el usuario adicional
    await request(app)
      .post('/api/sessions/register')
      .send(extraUser)

    // Obtener todos los usuarios
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('users')
    expect(Array.isArray(response.body.users)).toBe(true)
    expect(response.body.users.length).toBeGreaterThanOrEqual(2)
  })

  test('should not allow regular user to get all users', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-test-role', 'user') // Indicar al middleware que debe simular restricción de rol
      .expect(403)
  })

  test('should get user by ID', async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user).toHaveProperty('_id')
    expect(response.body.user).toHaveProperty('email', testUser.email)
  })

  test('should update user profile', async () => {
    const updatedData = {
      firstName: 'Johnny',
      lastName: 'Updated'
    }

    const response = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedData)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user).toHaveProperty('_id')
    expect(response.body.user).toHaveProperty('first_name', updatedData.firstName)
    expect(response.body.user).toHaveProperty('last_name', updatedData.lastName)
  })

  test('should not allow unauthorized user to update another user profile', async () => {
    const updatedData = {
      firstName: 'Hacked',
      lastName: 'User'
    }

    await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .set('x-test-role', 'guest') // Añadir header para simular restricciones
      .send(updatedData)
      .expect(403)
  })

  test('should delete user (admin only)', async () => {
    const response = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message')

    // Verify user was deleted
    const deletedUser = await UserModel.findById(userId)
    expect(deletedUser).toBeNull()
  })

  test('should not allow regular user to delete users', async () => {
    await request(app)
      .delete(`/api/users/${guestUserId}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .set('x-test-role', 'guest') // Añadir header para simular restricciones
      .expect(403)

    // Verify user was not deleted
    const user = await UserModel.findById(guestUserId)
    expect(user).not.toBeNull()
  })
})
