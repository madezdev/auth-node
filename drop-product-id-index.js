// Script para eliminar el índice único de product_id en la colección de productos
import mongoose from 'mongoose'
import secureConfig from './src/config/secure-config.js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

async function dropProductIdIndex () {
  try {
    // Obtener URI de conexión
    const uri = process.env.MONGODB_URI || secureConfig.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno ni en secure-config')
    }

    // Conectar a la base de datos
    console.log('Conectando a la base de datos...')
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000
    })
    console.log('Conexión establecida')

    // Obtener la colección de productos directamente
    const db = mongoose.connection.db
    const productsCollection = db.collection('products')

    // Listar los índices existentes
    console.log('Índices existentes:')
    const indices = await productsCollection.indexes()
    indices.forEach(index => {
      console.log(JSON.stringify(index, null, 2))
    })

    // Buscar y eliminar el índice de product_id
    const productIdIndex = indices.find(index => index.key && index.key.product_id)

    if (productIdIndex) {
      console.log('Encontrado índice para product_id:', productIdIndex.name)

      // Eliminar el índice
      console.log('Eliminando índice...')
      await productsCollection.dropIndex(productIdIndex.name)
      console.log('Índice eliminado correctamente')

      // Verificar que se haya eliminado
      console.log('Índices actualizados:')
      const updatedIndices = await productsCollection.indexes()
      updatedIndices.forEach(index => {
        console.log(JSON.stringify(index, null, 2))
      })
    } else {
      console.log('No se encontró ningún índice para product_id')
    }
  } catch (error) {
    console.error('Error al eliminar el índice:', error)
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close()
    console.log('Conexión cerrada')
  }
}

// Ejecutar la función
dropProductIdIndex()
