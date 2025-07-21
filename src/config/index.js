import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const dbConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error(
        'MONGODB_URI no está definida en las variables de entorno'
      )
    }

    await mongoose.connect(uri)

    console.log('Base de datos conectada')
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error)
    throw new Error('Error al conectar a la base de datos')
  }
}

export default {
  PORT: process.env.PORT || 3000,
  SECRET: process.env.JWT_SECRET,
  dbConnection
}
