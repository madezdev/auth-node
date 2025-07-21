import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import secureConfig from '../src/config/secure-config.js'
import { beforeAll, afterAll } from '@jest/globals'

// Variable global para la instancia de MongoDB
let mongoServer

// Forzar cierre de conexiones existentes antes de iniciar
beforeAll(async () => {
  // Cerrar conexiones existentes si hay alguna
  if (mongoose.connection.readyState !== 0) {
try {
  await mongoose.connection.close()
  console.log('Conexión previa a MongoDB cerrada correctamente')
} catch (error) {
  console.warn('Error al cerrar conexión previa:', error.message)
}
  }
})

// Configuración para usar MongoDB en memoria para tests
export const setupTestDB = async () => {
  // Aumentar el timeout de operaciones de Mongoose
  mongoose.set('bufferTimeoutMS', 60000)

  try {
// Si ya existe una conexión activa, no crear una nueva
if (mongoose.connection.readyState !== 0) {
  console.log('Usando conexión existente a MongoDB')
  return
}

// Usar MongoDB en memoria para tests si está disponible
if (process.env.NODE_ENV === 'test') {
  // Si ya existe una instancia, intentar detenerla
  if (mongoServer) {
try {
  await mongoServer.stop()
  console.log('Instancia previa de MongoDB detenida correctamente')
} catch (err) {
  console.warn('Error al detener instancia previa:', err.message)
}
  }
  
  // Crear nueva instancia con puerto dinámico
  mongoServer = await MongoMemoryServer.create({
instance: {
  // Usar puerto 0 para que se asigne dinámicamente un puerto libre
  port: 0
}
  })
  
  const uri = mongoServer.getUri()
  await mongoose.connect(uri, {
serverSelectionTimeoutMS: 60000,
socketTimeoutMS: 60000,
connectTimeoutMS: 60000
  })
  console.log('Conectado a MongoDB en memoria para tests')
} else {
  // Usar base de datos normal
  const uri = process.env.MONGODB_URI || secureConfig.MONGODB_URI
  await mongoose.connect(uri, {
serverSelectionTimeoutMS: 60000,
socketTimeoutMS: 60000,
connectTimeoutMS: 60000
  })
  console.log('Conectado a MongoDB para tests')
}
  } catch (error) {
console.error('Error al conectar a MongoDB:', error)
// No lanzar el error, solo registrarlo para permitir que los tests continúen
console.log('Continuando tests a pesar del error de conexión')
  }
}

export const closeTestDB = async () => {
  try {
// Verificar si la conexión está activa antes de intentar cerrarla
if (mongoose.connection.readyState !== 0) {
  // Intentar eliminar la base de datos, pero no fallar si hay error
  try {
await mongoose.connection.dropDatabase()
  } catch (dropError) {
console.warn('No se pudo eliminar la base de datos:', dropError.message)
  }
  
  // Cerrar la conexión
  await mongoose.connection.close()
}

// Detener el servidor MongoDB en memoria si existe
if (mongoServer) {
  await mongoServer.stop()
  mongoServer = null
}

console.log('Conexión a MongoDB cerrada correctamente')
  } catch (error) {
console.error('Error al cerrar MongoDB:', error)
// No lanzar el error para permitir que los tests continúen
console.log('Continuando a pesar del error al cerrar MongoDB')
  }
}

// Asegurar que las conexiones se cierren después de todos los tests
afterAll(async () => {
  await closeTestDB()
})
