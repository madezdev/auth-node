import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import jwt from 'jsonwebtoken'
import config from '../src/config/index.js'
// Import Jest functions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'

// Variables para almacenar datos entre pruebas
let adminToken = ''
let testProductId = ''
const testProduct = {
  name: 'Test Product',
  description: 'This is a test product',
  price: 999,
  stock: 50,
  category: 'test'
}
const updatedProduct = {
  description: 'Updated description',
  price: 1299,
  stock: 75
}

// Configurar base de datos de prueba
beforeAll(async () => {
  await setupTestDB()

  // Limpiar las colecciones antes de comenzar
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})

  // Crear usuario admin para pruebas
  const adminUser = await UserModel.create({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
    age: 30,
    password: 'testpassword',
    role: 'admin'
  })

  // Generar token JWT para el admin
  adminToken = jwt.sign(
    { id: adminUser._id, email: adminUser.email, role: adminUser.role },
    config.SECRET,
    { expiresIn: '1h' }
  )
}, 60000)

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await closeTestDB()
}, 60000)

describe('Product API Tests', () => {
  describe('POST /api/products', () => {
    test('should create a new product when authenticated as admin', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct)

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.message).toBe('Producto creado exitosamente')
      expect(response.body.product).toHaveProperty('_id')
      expect(response.body.product.name).toBe(testProduct.name)

      // Guardar ID para pruebas posteriores
      testProductId = response.body.product._id
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(testProduct)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Product'
          // Faltan campos obligatorios
        })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
    }, 30000)
  })

  describe('GET /api/products', () => {
    test('should get all products', async () => {
      // Garantizar que tenemos al menos un producto
      if (testProductId) {
        const response = await request(app).get('/api/products')

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(Array.isArray(response.body.payload)).toBe(true)
        expect(response.body.payload.length).toBeGreaterThan(0)
        expect(response.body).toHaveProperty('totalPages')
        expect(response.body).toHaveProperty('page')
      } else {
        // Si no tenemos un ID de producto, primero creamos uno
        const createResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testProduct)

        testProductId = createResponse.body.product._id

        // Luego consultamos todos
        const response = await request(app).get('/api/products')

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(Array.isArray(response.body.payload)).toBe(true)
        expect(response.body.payload.length).toBeGreaterThan(0)
      }
    }, 30000)

    test('should filter products by category', async () => {
      // Crear un producto con categoría específica para el test
      await ProductModel.create({
        name: 'Category Test Product',
        description: 'Product for category testing',
        price: 500,
        stock: 10,
        category: 'special_category'
      })

      const response = await request(app)
        .get('/api/products?category=special_category')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)

      // Todos los productos devueltos deben tener la categoría solicitada
      response.body.payload.forEach(product => {
        expect(product.category).toBe('special_category')
      })
    }, 30000)

    test('should paginate results', async () => {
      // Crear varios productos para probar paginación
      const productsToCreate = []
      for (let i = 0; i < 15; i++) {
        productsToCreate.push({
          name: `Pagination Product ${i}`,
          description: 'Product for pagination testing',
          price: 100 + i,
          stock: 5,
          category: 'pagination'
        })
      }
      await ProductModel.insertMany(productsToCreate)

      const response = await request(app)
        .get('/api/products?page=1&limit=10&category=pagination')

      expect(response.status).toBe(200)
      expect(response.body.payload.length).toBeLessThanOrEqual(10)
      expect(response.body.hasNextPage).toBe(true)
    }, 30000)
  })

  describe('GET /api/products/:id', () => {
    test('should get a product by id', async () => {
      // Asegurarnos de que tenemos un ID válido para consultar
      if (!testProductId) {
        // Crear un producto si no existe
        const createResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testProduct)

        testProductId = createResponse.body.product._id
      }
      
      const response = await request(app)
        .get(`/api/products/${testProductId}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.product._id).toBe(testProductId)
      expect(response.body.product.name).toBe(testProduct.name)
    }, 30000)

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Producto no encontrado')
    }, 30000)

    test('should return 400 for invalid product id', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('ID de producto inválido')
    }, 30000)
  })

  describe('PUT /api/products/:id', () => {
    test('should update a product when authenticated as admin', async () => {
      // Asegurarnos de que tenemos un ID válido para actualizar
      if (!testProductId) {
        // Crear un producto si no existe
        const createResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testProduct)

        testProductId = createResponse.body.product._id
      }
      
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedProduct)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.message).toBe('Producto actualizado exitosamente')
      expect(response.body.product.description).toBe(updatedProduct.description)
      expect(response.body.product.price).toBe(updatedProduct.price)
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      // Asegurarnos de que tenemos un ID válido para la prueba
      if (!testProductId) {
        // Crear un producto si no existe
        const createResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testProduct)

        testProductId = createResponse.body.product._id
      }
      
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .send(updatedProduct)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedProduct)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Producto no encontrado')
    }, 30000)
  })

  describe('DELETE /api/products/:id', () => {
    test('should delete a product when authenticated as admin', async () => {
      // Crear un producto específicamente para eliminar
      const productToDelete = await ProductModel.create({
        name: 'Product to be deleted',
        description: 'This product will be deleted in the test',
        price: 1000,
        stock: 20,
        category: 'test'
      })
      
      const deleteId = productToDelete._id.toString()
      
      const response = await request(app)
        .delete(`/api/products/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.message).toBe('Producto eliminado exitosamente')

      // Verificar que el producto ya no existe
      const deletedProduct = await ProductModel.findById(deleteId)
      expect(deletedProduct).toBeNull()
    }, 30000)

    test('should return 401 when not authenticated', async () => {
      // Crear un nuevo producto para la prueba
      const newProduct = await ProductModel.create({
        name: 'Product for auth test',
        description: 'This product is for testing authentication',
        price: 500,
        stock: 10,
        category: 'test'
      })

      const response = await request(app)
        .delete(`/api/products/${newProduct._id}`)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe('error')
    }, 30000)

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Producto no encontrado')
    }, 30000)
  })
})
