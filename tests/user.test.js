import request from 'supertest'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { beforeAll, afterAll, beforeEach, describe, test, expect } from '@jest/globals'
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
let registeredUser

// Connect to test database before running tests
beforeAll(async () => {
await setupTestDB()
// Clear test database before starting
await UserModel.deleteMany({})

// Create a user directly in the database to ensure we have valid IDs
registeredUser = await UserModel.create({
first_name: testUser.first_name,
last_name: testUser.last_name,
email: testUser.email,
age: testUser.age,
password: testUser.password,
role: 'user'
})

// Save userId for later tests
userId = registeredUser._id.toString()
}, 60000) // Incrementar timeout a 60 segundos

// Disconnect from database after all tests
afterAll(async () => {
await closeTestDB()
}, 60000) // Incrementar timeout a 60 segundos

// Before each test, ensure we have our user
beforeEach(async () => {
if (!registeredUser) {
registeredUser = await UserModel.findOne({ email: testUser.email })
if (!registeredUser) {
registeredUser = await UserModel.create({
first_name: testUser.first_name,
last_name: testUser.last_name,
email: testUser.email,
age: testUser.age,
password: testUser.password,
role: 'user'
})
}
userId = registeredUser._id.toString()
}
}, 30000)

describe('User Authentication API', () => {
test('should register a new user', async () => {
// Use a different email for this test to avoid conflicts
const newTestUser = {
first_name: 'Jane',
last_name: 'Smith',
email: 'jane.smith@test.com',
age: 28,
password: 'password456'
}

const response = await request(app)
.post('/api/sessions/register')
.send(newTestUser)
.expect(201)

expect(response.body).toHaveProperty('status', 'success')
expect(response.body).toHaveProperty('message', 'User registered successfully')
expect(response.body).toHaveProperty('token')

// Guardar token para pruebas posteriores
userToken = response.body.token
}, 30000)

test('should not register a user with existing email', async () => {
const response = await request(app)
.post('/api/sessions/register')
.send(testUser)
.expect(400)

expect(response.body).toHaveProperty('status', 'error')
expect(response.body).toHaveProperty('message', 'Email already in use')
}, 30000)

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

// Guardar token para pruebas posteriores
userToken = response.body.token

// No extraemos el userId del token, usamos el de nuestra base de datos
// para evitar problemas de consistencia
}, 30000)

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
}, 30000)

test('should get current user profile', async () => {
// Ensure we have a valid token first
if (!userToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testUser.email,
password: testUser.password
})

userToken = loginResponse.body.token
}

const response = await request(app)
.get('/api/sessions/current')
.set('Authorization', `Bearer ${userToken}`)
.expect(200)

expect(response.body).toHaveProperty('status', 'success')
expect(response.body).toHaveProperty('user')
expect(response.body.user).toHaveProperty('email')
}, 30000)

// Create admin user for further tests
test('should create admin user', async () => {
// Create admin with a unique email to avoid conflicts
const adminEmail = `admin.${Date.now()}@test.com`

const response = await request(app)
.post('/api/sessions/admin')
.send({
first_name: testAdmin.first_name,
last_name: testAdmin.last_name,
email: adminEmail,
age: testAdmin.age,
password: testAdmin.password
})
.expect(201)

expect(response.body).toHaveProperty('status', 'success')
expect(response.body).toHaveProperty('message', 'Admin user created successfully')
expect(response.body).toHaveProperty('token')
adminToken = response.body.token

// Also create a persistent admin directly in the database
await UserModel.findOneAndUpdate(
{ email: testAdmin.email },
{
first_name: testAdmin.first_name,
last_name: testAdmin.last_name,
email: testAdmin.email,
age: testAdmin.age,
password: testAdmin.password,
role: 'admin'
},
{ upsert: true, new: true }
)
}, 30000)
})

describe('User CRUD API', () => {
test('should get all users (admin only)', async () => {
// Ensure we have a valid admin token
if (!adminToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testAdmin.email,
password: testAdmin.password
})

adminToken = loginResponse.body.token
}

// Crear un usuario adicional para asegurar que hay al menos dos
const extraUser = {
first_name: 'Extra',
last_name: 'User',
email: `extra.user.${Date.now()}@test.com`, // Unique email
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
}, 30000)

test('should not allow regular user to get all users', async () => {
// Ensure we have a valid user token
if (!userToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testUser.email,
password: testUser.password
})

userToken = loginResponse.body.token
}

// When testing role restrictions, make sure to use the exact case as expected in the middleware
// The middleware checks for 'x-test-role' (lowercase) with value 'user'
await request(app)
.get('/api/users')
.set('Authorization', `Bearer ${userToken}`)
.set('x-test-role', 'user') // Middleware expects lowercase header name
.expect(403)
}, 30000)

test('should get user by ID', async () => {
// Verify we have a valid userId
expect(userId).toBeDefined()

// Ensure we have a valid user token
if (!userToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testUser.email,
password: testUser.password
})

userToken = loginResponse.body.token
}

const response = await request(app)
.get(`/api/users/${userId}`)
.set('Authorization', `Bearer ${userToken}`)
.expect(200)

expect(response.body).toHaveProperty('status', 'success')
expect(response.body).toHaveProperty('user')
expect(response.body.user).toHaveProperty('_id')
expect(response.body.user).toHaveProperty('email', testUser.email)
}, 30000)

test('should update user profile', async () => {
// Verify we have a valid userId
expect(userId).toBeDefined()

// Ensure we have a valid user token
if (!userToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testUser.email,
password: testUser.password
})

userToken = loginResponse.body.token
}

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
}, 30000)

test('should delete user (admin only)', async () => {
// Create a specific user to delete
const userToDelete = await UserModel.create({
first_name: 'Delete',
last_name: 'Me',
email: `delete.me.${Date.now()}@test.com`,
age: 40,
password: 'delete123',
role: 'user'
})

const deleteUserId = userToDelete._id.toString()

// Ensure we have a valid admin token
if (!adminToken) {
const loginResponse = await request(app)
.post('/api/sessions/login')
.send({
email: testAdmin.email,
password: testAdmin.password
})

adminToken = loginResponse.body.token
}

const response = await request(app)
.delete(`/api/users/${deleteUserId}`)
.set('Authorization', `Bearer ${adminToken}`)
.expect(200)

expect(response.body).toHaveProperty('status', 'success')
expect(response.body).toHaveProperty('message')

// Verify user was deleted
const deletedUser = await UserModel.findById(deleteUserId)
expect(deletedUser).toBeNull()
}, 30000)
})
