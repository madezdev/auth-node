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
  title: 'Panel Solar 400W',
  slug: 'panel-solar-400w',
  description: 'Panel solar monocristalino de alta eficiencia',
  brand: 'SolarTech',
  model: 'ST-400M',
  origin: 'China',
  price: {
    price: 999,
    iva: 21,
    isOffer: false
  },
  stock: 50,
  category: 'fotovoltaico',
  subCategory: 'panel_solar',
  imagePath: ['https://example.com/images/panel-solar-400w.jpg'],
  characteristic: {
    potencia: '400W',
    tipo: 'Monocristalino',
    eficiencia: '21.3%',
    dimensiones: '1755x1038x35mm',
    peso: '19.5kg'
  },
  warranty: '25 años de garantía de rendimiento lineal',
  tags: ['panel solar', 'monocristalino', '400w', 'energía renovable'],
  system: ['on-grid', 'off-grid']
}

const updatedProduct = {
  description: 'Panel solar monocristalino de alta eficiencia actualizado',
  price: {
    price: 1099,
    isOffer: true
  },
  stock: 75,
  tags: ['panel solar', 'monocristalino', '400w', 'energía solar', 'oferta']
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

describe('Product API Tests (Updated Schema)', () => {
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
      expect(response.body.product.title).toBe(testProduct.title)
      expect(response.body.product.slug).toBe(testProduct.slug)
      expect(response.body.product.brand).toBe(testProduct.brand)
      expect(response.body.product.price.price).toBe(testProduct.price.price)

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
          title: 'Producto Incompleto'
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
        title: 'Batería de litio',
        slug: 'bateria-de-litio',
        description: 'Batería de litio para almacenamiento de energía',
        brand: 'PowerBank',
        model: 'PB-500',
        origin: 'Alemania',
        price: {
          price: 2500,
          iva: 21,
          isOffer: false
        },
        stock: 15,
        category: 'fotovoltaico',
        subCategory: 'baterias',
        imagePath: ['https://example.com/images/bateria.jpg'],
        characteristic: {
          capacidad: '5kWh',
          tension: '48V',
          ciclos: '5000'
        }
      })

      const response = await request(app)
        .get('/api/products?category=fotovoltaico&subCategory=baterias')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(Array.isArray(response.body.payload)).toBe(true)
      expect(response.body.payload.length).toBeGreaterThan(0)

      // Todos los productos devueltos deben tener la categoría y subcategoría solicitadas
      response.body.payload.forEach(product => {
        expect(product.category).toBe('fotovoltaico')
        expect(product.subCategory).toBe('baterias')
      })
    }, 30000)

    test('should paginate results', async () => {
      // Crear varios productos para probar paginación
      const productsToCreate = []
      for (let i = 0; i < 15; i++) {
        productsToCreate.push({
          title: `Inversor ${i}`,
          slug: `inversor-${i}`,
          description: `Inversor de prueba ${i}`,
          brand: 'TestBrand',
          model: `TB-${i}`,
          origin: 'España',
          price: {
            price: 1000 + i * 50,
            iva: 21,
            isOffer: i % 3 === 0 // Cada tercer producto es oferta
          },
          stock: 10 + i,
          category: 'fotovoltaico',
          subCategory: 'inversor',
          imagePath: [`https://example.com/images/inversor-${i}.jpg`]
        })
      }
      
      await ProductModel.insertMany(productsToCreate)
      
      const response = await request(app)
        .get('/api/products?page=1&limit=10&category=fotovoltaico&subCategory=inversor')

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
      expect(response.body.product.title).toBe(testProduct.title)
      expect(response.body.product.slug).toBe(testProduct.slug)
      expect(response.body.product.price.price).toBe(testProduct.price.price)
    }, 30000)

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = '60f7e5b0e4a3c5b3a8f7e5b0'
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Producto no encontrado')
    }, 30000)

    test('should return 400 for invalid ID format', async () => {
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
      expect(response.body.product.price.price).toBe(updatedProduct.price.price)
      expect(response.body.product.price.isOffer).toBe(updatedProduct.price.isOffer)
      // El campo iva no debería haber cambiado porque no lo incluimos en la actualización
      expect(response.body.product.price.iva).toBe(testProduct.price.iva)
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
        title: 'Producto para eliminar',
        slug: 'producto-para-eliminar',
        description: 'Este producto será eliminado en el test',
        brand: 'TestBrand',
        model: 'TD-100',
        origin: 'Argentina',
        price: {
          price: 1000,
          iva: 21,
          isOffer: false
        },
        stock: 20,
        category: 'fotovoltaico',
        imagePath: ['https://example.com/images/eliminar.jpg']
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
        title: 'Producto para test de autenticación',
        slug: 'producto-test-auth',
        description: 'Este producto es para probar autenticación',
        brand: 'TestBrand',
        model: 'TA-100',
        origin: 'Argentina',
        price: {
          price: 500,
          iva: 21,
          isOffer: false
        },
        stock: 10,
        category: 'fotovoltaico',
        imagePath: ['https://example.com/images/auth-test.jpg']
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
