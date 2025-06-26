import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import secureConfig from '../src/config/secure-config.js'

let mongoServer

// Configuración para usar MongoDB en memoria para tests
export const setupTestDB = async () => {
  // Aumentar el timeout de operaciones de Mongoose
  mongoose.set('bufferTimeoutMS', 30000)

  try {
    // Usar MongoDB en memoria para tests si está disponible
    if (process.env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create()
      const uri = mongoServer.getUri()
      await mongoose.connect(uri)
      console.log('Conectado a MongoDB en memoria para tests')
    } else {
      // Usar base de datos normal
      const uri = process.env.MONGODB_URI || secureConfig.MONGODB_URI
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 30000
      })
      console.log('Conectado a MongoDB para tests')
    }
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error)
    throw error
  }
}

export const closeTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    if (mongoServer) {
      await mongoServer.stop()
    }
    console.log('Conexión a MongoDB cerrada')
  } catch (error) {
    console.error('Error al cerrar MongoDB:', error)
    throw error
  }
}
