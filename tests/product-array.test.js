import request from 'supertest'
import { app } from '../src/server/server.js'
import { setupTestDB, closeTestDB } from './setup.js'
import { UserModel } from '../src/models/user.model.js'
import { ProductModel } from '../src/models/product.model.js'
import jwt from 'jsonwebtoken'
import config from '../src/config/index.js'
// Import Jest functions
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
// Import path para mock files
import path from 'path'
import fs from 'fs'

// Variables para almacenar datos entre pruebas
let adminToken = ''

// Configurar base de datos de prueba
beforeAll(async () => {
  // Establecer NODE_ENV a 'test' explícitamente
  process.env.NODE_ENV = 'test'

  await setupTestDB()

  // Crear usuario admin para pruebas
  const adminUser = await UserModel.create({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@test.com',
    password: 'testpassword',
    role: 'admin',
    // Agregar campos obligatorios que faltaban
    idNumber: '123456789',
    birthDate: '1990-01-01',
    activityType: 'Empleado',
    activityNumber: 'ACT123456',
    phone: '123456789',
    address: {
      street: 'Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country'
    }
  })

  // Generar token JWT para el admin
  adminToken = jwt.sign(
    { id: adminUser._id, email: adminUser.email, role: adminUser.role },
    config.SECRET,
    { expiresIn: '1h' }
  )

  // Crear directorio para archivos de prueba si no existe
  const testAssetsDir = path.join(process.cwd(), 'tests', 'assets')
  if (!fs.existsSync(testAssetsDir)) {
    fs.mkdirSync(testAssetsDir, { recursive: true })
  }

  // Crear un archivo de texto simple para pruebas
  const testFilePath = path.join(testAssetsDir, 'test-file.txt')
  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, 'Este es un archivo de prueba para tests')
  }
})

// Limpiar base de datos después de todas las pruebas
afterAll(async () => {
  await UserModel.deleteMany({})
  await ProductModel.deleteMany({})
  await closeTestDB()
})

describe('Product Arrays API Tests', () => {
  test('should create a product with array fields using multipart/form-data', async () => {
    // Crear una solicitud multipart/form-data
    const testFilePath = path.join(process.cwd(), 'tests', 'assets', 'test-file.txt')
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Panel solar 585W')
      .field('description', '14.36A (Isc) | 51.58V (Voc) | 144 medias celdas | Monocristalino Half')
      .field('information', 'Panel solar 585W bifacial monocristalino Astro N5 - Tier 1, 144 celdas')
      .field('product_code', '5912')
      .field('supplier', 'VPF Solar')
      .field('brand', 'Astronergy')
      .field('model', 'Astro N5')
      .field('warranty', '30 años de garantía de potencia lineal, 15 años de garantía de producto')
      .field('slug', 'panel-solar-585wp-astronergy-5912')
      .field('origin', 'China')
      .field('price', '98')
      .field('iva', '10.5')
      .field('discount', 'false')
      .field('stock', '50')
      .field('category', 'fotovoltaico')
      .field('subcategory', 'multisistema')
      // Campos array se envían como múltiples campos con el mismo nombre
      .field('system', 'on-grid')
      .field('system', 'off-grid')
      .field('partner', 'partner1')
      .field('partner', 'partner2')
      .field('family', 'family1')
      .field('family', 'family2')
      .field('tags', 'test')
      .field('tags', 'producto')
      .field('tags', 'solar')
      .field('characteristics', JSON.stringify({'dim':'10x10','weight':'1kg'}))
      .attach('files', testFilePath)
    // Verificar respuesta
    expect(response.status).toBe(201)
    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('Producto creado exitosamente')
    expect(response.body.product).toHaveProperty('_id')
    // Verificar que los arrays se hayan guardado correctamente
    expect(Array.isArray(response.body.product.system)).toBe(true)
    expect(response.body.product.system).toContain('on-grid')
    expect(response.body.product.system).toContain('off-grid')
  })

  test('should convert single values to arrays with multipart/form-data', async () => {
    const testFilePath = path.join(process.cwd(), 'tests', 'assets', 'test-file.txt')
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Panel solar 585W - String Test')
      .field('description', '14.36A (Isc) | 51.58V (Voc) | 144 medias celdas | Monocristalino Half')
      .field('information', 'Panel solar 585W bifacial monocristalino Astro N5 - Tier 1, 144 celdas')
      .field('product_code', '5913')
      .field('supplier', 'VPF Solar')
      .field('brand', 'Astronergy')
      .field('model', 'Astro N5')
      .field('warranty', '30 años de garantía de potencia lineal, 15 años de garantía de producto')
      .field('slug', 'panel-solar-585wp-astronergy-5913')
      .field('origin', 'China')
      .field('price', '98')
      .field('iva', '10.5')
      .field('discount', 'false')
      .field('stock', '50')
      .field('category', 'fotovoltaico')
      .field('subcategory', 'multisistema')
      // Enviamos un solo valor para campos que deberían ser arrays
      .field('system', 'on-grid')
      .field('partner', 'partner1')
      .field('family', 'family1')
      .field('tags', 'test')
      .field('characteristics', JSON.stringify({ 'dim': '10x10', 'weight': '1kg' }))
      .attach('files', testFilePath)

    // Verificar respuesta
    expect(response.status).toBe(201)
    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('Producto creado exitosamente')

    // Verificar que los valores simples se hayan convertido en arrays
    expect(Array.isArray(response.body.product.system)).toBe(true)
    expect(response.body.product.system).toContain('on-grid')

    expect(Array.isArray(response.body.product.partner)).toBe(true)
    expect(response.body.product.partner).toContain('partner1')
  })
})
