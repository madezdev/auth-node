import request from 'supertest'
import { app } from '../src/server/server.js'
import { UserModel } from '../src/models/user.model.js'
import { ShippingAddressModel } from '../src/models/shipping-address.model.js'
import { beforeAll, afterAll, beforeEach, describe, test, expect } from '@jest/globals'
import { setupTestDB, closeTestDB } from './setup.js'

// Test user data
const testUser = {
  first_name: 'Address',
  last_name: 'Tester',
  email: 'address.tester@test.com',
  password: 'password123',
  role: 'guest', // Iniciamos como 'guest' para probar la promoción a 'user'
  phone: '+1234567890',
  tax_identifier: 12345678,
  identifier: 87654321,
  birthday: new Date('1990-01-01')
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

const updatedAddress = {
  state: 'New York',
  street: '456 Broadway',
  postalCode: '10001',
  country: 'USA',
  apt: 202,
  locality: 'Manhattan',
  details: 'Corner building',
  isDefault: true
}

// Test admin data for permission testing
const testAdmin = {
  first_name: 'Admin',
  last_name: 'Address',
  email: 'admin.address@test.com',
  password: 'admin123',
  role: 'admin',
  phone: '+1987654321',
  tax_identifier: 98765432,
  identifier: 12345678,
  birthday: new Date('1985-05-05')
}

let userToken
let adminToken
let userId
let adminId
let registeredUser
let addressId

// Connect to test database before running tests
beforeAll(async () => {
  await setupTestDB()
  // Clear test collections before starting
  await UserModel.deleteMany({})
  await ShippingAddressModel.deleteMany({})

  // Create a user directly in the database
  registeredUser = await UserModel.create({
    first_name: testUser.first_name,
    last_name: testUser.last_name,
    email: testUser.email,
    phone: testUser.phone,
    tax_identifier: testUser.tax_identifier,
    identifier: testUser.identifier,
    birthday: testUser.birthday,
    password: testUser.password,
    role: testUser.role
  })

  // Save userId for later tests
  userId = registeredUser._id.toString()

  // Create admin user
  const adminUser = await UserModel.create({
    first_name: testAdmin.first_name,
    last_name: testAdmin.last_name,
    email: testAdmin.email,
    phone: testAdmin.phone,
    tax_identifier: testAdmin.tax_identifier,
    identifier: testAdmin.identifier,
    birthday: testAdmin.birthday,
    password: testAdmin.password,
    role: testAdmin.role
  })

  // Save adminId for later tests
  adminId = adminUser._id.toString()
}, 60000)

// Disconnect from database after all tests
afterAll(async () => {
  await closeTestDB()
}, 60000)

// Login before tests
beforeEach(async () => {
  if (!userToken) {
    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/sessions/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })

    userToken = userLoginResponse.body.token
  }

  if (!adminToken) {
    // Login as admin (ID: ${adminId})
    console.log(`Admin ID: ${adminId}`) // Usar explícitamente adminId
    const { body: adminLoginRes } = await request(app)
      .post('/api/sessions/login')
      .send({ email: testAdmin.email, password: testAdmin.password })

    adminToken = adminLoginRes.token
  }
}, 30000)

describe('Shipping Address API', () => {
  test('should create a new shipping address', async () => {
    const response = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testAddress)
      .expect(201)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('payload')
    expect(response.body.payload).toHaveProperty('id')
    expect(response.body.payload).toHaveProperty('postalCode', testAddress.postalCode)
    expect(response.body.payload).toHaveProperty('country', testAddress.country)
    expect(response.body.payload).toHaveProperty('locality', testAddress.locality)
    expect(response.body.payload).toHaveProperty('apt', testAddress.apt)
    expect(response.body.payload).toHaveProperty('details', testAddress.details)
    expect(response.body.payload).toHaveProperty('isDefault', testAddress.isDefault)

    // Save addressId for later tests
    addressId = response.body.payload.id

    // Verificar que el usuario haya sido promocionado a 'user'
    const updatedUser = await UserModel.findById(userId)
    expect(updatedUser.role).toBe('user')
  }, 30000)

  test('should get all addresses for the user', async () => {
    const response = await request(app)
      .get('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('payload')
    expect(Array.isArray(response.body.payload)).toBe(true)
    expect(response.body.payload.length).toBeGreaterThan(0)
  }, 30000)

  test('should get default address for the user', async () => {
    const response = await request(app)
      .get('/api/shipping-addresses/default')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('payload')
    expect(response.body.payload).toHaveProperty('id')
    expect(response.body.payload).toHaveProperty('isDefault', true)
  }, 30000)

  test('should update a shipping address', async () => {
    // Asegurarse de que tenemos un addressId válido
    expect(addressId).toBeDefined()

    const response = await request(app)
      .put(`/api/shipping-addresses/${addressId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedAddress)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('payload')
    expect(response.body.payload).toHaveProperty('id', addressId)
    expect(response.body.payload).toHaveProperty('state', updatedAddress.state)
    expect(response.body.payload).toHaveProperty('street', updatedAddress.street)
    expect(response.body.payload).toHaveProperty('postalCode', updatedAddress.postalCode)
  }, 30000)

  test('should set address as default', async () => {
    // Crear una segunda dirección primero
    const secondAddressResponse = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...testAddress,
        street: '456 Second St',
        isDefault: false,
        details: 'Second address'
      })

    const secondAddressId = secondAddressResponse.body.payload.id

    // Establecer la segunda dirección como predeterminada
    const response = await request(app)
      .post(`/api/shipping-addresses/${secondAddressId}/default`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body).toHaveProperty('message', 'Dirección predeterminada actualizada')

    // Verificar que la dirección realmente se actualizó obteniendo todas las direcciones
    const addressesResponse = await request(app)
      .get('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    const updatedAddress = addressesResponse.body.payload.find(addr => addr.id === secondAddressId)
    expect(updatedAddress).toBeDefined()
    expect(updatedAddress.isDefault).toBe(true)

    // Verificar que la primera dirección ya no es la predeterminada
    // Obtenemos todas las direcciones y filtramos
    const allAddressesResponse = await request(app)
      .get('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    const firstAddress = allAddressesResponse.body.payload.find(addr => addr.id === addressId)
    expect(firstAddress).toBeDefined()
    expect(firstAddress.isDefault).toBe(false)
  }, 30000)

  test('should not allow access to address owned by another user', async () => {
    // Crear otro usuario con todos los campos requeridos
    const otherUser = await UserModel.create({
      first_name: 'Other',
      last_name: 'User',
      email: 'other.user@test.com',
      password: 'password123',
      role: 'user',
      phone: '+1111222333',
      tax_identifier: 11223344,
      identifier: 44332211,
      birthday: new Date('1995-05-05')
    })

    // Iniciar sesión con el nuevo usuario - usar la contraseña correcta
    const otherUserLoginResponse = await request(app)
      .post('/api/sessions/login')
      .send({
        email: otherUser.email,
        password: 'password123'
      })
      .expect(200)

    const otherUserToken = otherUserLoginResponse.body.token
    expect(otherUserToken).toBeDefined()

    // Intentar actualizar la dirección del usuario original
    await request(app)
      .put(`/api/shipping-addresses/${addressId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send(updatedAddress)
      .expect(403) // Forbidden - No es propietario de la dirección
  }, 30000)

  test('admin should have access to any address', async () => {
    // El admin debería poder actualizar cualquier dirección
    const response = await request(app)
      .put(`/api/shipping-addresses/${addressId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...updatedAddress,
        details: 'Updated by admin'
      })
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')
    expect(response.body.payload).toHaveProperty('details', 'Updated by admin')
  }, 30000)

  test('should delete a shipping address', async () => {
    // Crear una dirección para eliminar
    const addressToDeleteResponse = await request(app)
      .post('/api/shipping-addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...testAddress,
        street: '789 Delete St',
        isDefault: false,
        details: 'Address to delete'
      })

    const addressToDeleteId = addressToDeleteResponse.body.payload.id

    // Eliminar la dirección
    const response = await request(app)
      .delete(`/api/shipping-addresses/${addressToDeleteId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)

    expect(response.body).toHaveProperty('status', 'success')

    // Verificar que la dirección fue eliminada
    const deletedAddress = await ShippingAddressModel.findById(addressToDeleteId)
    expect(deletedAddress).toBeNull()
  }, 30000)
})
