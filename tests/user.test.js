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
  age: 30,
  password: 'password123'
}

const testAdmin = {
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@test.com',
  age: 35,
  password: 'admin123',
  role: 'admin'
}

let userToken
let adminToken
let userId

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
    if (userToken) {
      const tokenParts = userToken.split('.')
      if (tokenParts && tokenParts.length >= 2) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          userId = payload.id || payload._id // handle both id and _id properties
          console.log('Successfully extracted userId:', userId)
        } catch (error) {
          console.error('Error parsing token:', error)
        }
      } else {
        console.error('Invalid token format, expected 3 parts but got:', tokenParts?.length)
      }
    } else {
      console.error('No user token available to extract userId')
    }
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
      lastName: 'Updated',
      age: 31
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
    expect(response.body.user).toHaveProperty('age', updatedData.age)
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
})
