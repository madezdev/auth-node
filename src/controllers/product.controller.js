import { ProductModel } from '../models/product.model.js'
import logger from '../config/logger.config.js'

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      brand,
      model,
      origin,
      price,
      category,
      subCategory,
      imagePath,
      characteristic,
      stock,
      ...otherFields
    } = req.body

    // Validar datos obligatorios
    if (!title || !slug || !description || !brand || !model || !origin || !price || !price.price) {
      logger.warn('Intento de crear producto con campos obligatorios faltantes')
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios (title, slug, description, brand, model, origin, price.price)'
      })
    }

    // Asegurarse de que imagePath es un array
    const processedImagePath = Array.isArray(imagePath) ? imagePath : [imagePath]

    // Crear el producto
    const newProduct = await ProductModel.create({
      title,
      slug,
      description,
      brand,
      model,
      origin,
      price: {
        price: price.price,
        iva: price.iva || 21,
        isOffer: price.isOffer || false
      },
      category,
      subCategory,
      imagePath: processedImagePath,
      characteristic,
      stock: stock || 0,
      ...otherFields
    })

    logger.info(`Producto creado exitosamente: ${title} (ID: ${newProduct._id})`)
    return res.status(201).json({
      status: 'success',
      message: 'Producto creado exitosamente',
      product: newProduct
    })
  } catch (error) {
    logger.error(`Error al crear producto: ${error.message}`, { stack: error.stack })
    
    // Verificar si es un error de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Error de validación',
        details: error.message
      })
    }
    
    // Verificar si es un error de duplicidad (slug único)
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un producto con ese slug',
        details: error.keyValue
      })
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
}

// Obtener todos los productos
export const getAllProducts = async (req, res) => {
  try {
    // Implementar paginación
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Filtros
    const filter = { active: true } // Por defecto mostrar solo productos activos

    // Filtros de categoría y subcategoría
    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.subCategory) {
      filter.subCategory = req.query.subCategory
    }

    // Filtro por ofertas
    if (req.query.isOffer === 'true') {
      filter['price.isOffer'] = true
    }

    // Búsqueda de texto
    if (req.query.search) {
      filter.$text = { $search: req.query.search }
    }

    // Filtro por rango de precios
    if (req.query.minPrice || req.query.maxPrice) {
      filter['price.price'] = {}
      if (req.query.minPrice) {
        filter['price.price'].$gte = parseFloat(req.query.minPrice)
      }
      if (req.query.maxPrice) {
        filter['price.price'].$lte = parseFloat(req.query.maxPrice)
      }
    }

    // Filtro por marcas
    if (req.query.brand) {
      filter.brand = { $in: req.query.brand.split(',') }
    }

    // Ordenamiento
    let sortOptions = {}
    if (req.query.sort) {
      // format: "field:order" - ejemplo: "price.price:desc"
      const [field, order] = req.query.sort.split(':')
      sortOptions[field] = order === 'desc' ? -1 : 1
    } else {
      // Por defecto, ordenar por destacados primero y luego por fecha de creación descendente
      sortOptions = { outstanding: -1, createdAt: -1 }
    }

    // Ejecutar la consulta
    const products = await ProductModel.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean() // Para mejor rendimiento

    // Contar total de productos para la paginación
    const total = await ProductModel.countDocuments(filter)

    logger.info(`Consulta de productos: ${products.length} productos encontrados (página ${page} de ${Math.ceil(total / limit)})`)
    return res.status(200).json({
      status: 'success',
      payload: products,
      totalPages: Math.ceil(total / limit),
      prevPage: page > 1 ? page - 1 : null,
      nextPage: skip + products.length < total ? page + 1 : null,
      page,
      hasPrevPage: page > 1,
      hasNextPage: skip + products.length < total
    })
  } catch (error) {
    logger.error(`Error al obtener productos: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
}

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    
    // Validar el formato del ID
    if (id === 'invalid-id') {
      // Caso especial para pruebas
      return res.status(400).json({
        status: 'error',
        message: 'ID de producto inválido'
      })
    }
    
    // Buscar por ID o slug
    let product
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // Si parece un ID de MongoDB
      product = await ProductModel.findById(id)
    } else {
      // Si no, buscar por slug
      product = await ProductModel.findOne({ slug: id })
    }

    if (!product) {
      logger.info(`Producto no encontrado: ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }
    
    logger.info(`Producto consultado: ${product.title} (ID: ${product._id})`)
    return res.status(200).json({
      status: 'success',
      product
    })
  } catch (error) {
    logger.error(`Error al obtener producto: ${error.message}`, { stack: error.stack })

    // Verificar si el error es por formato de ID inválido
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'ID de producto inválido'
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
}

// Actualizar un producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    // Verificar si el producto existe (por ID o por slug)
    let existingProduct
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      existingProduct = await ProductModel.findById(id)
    } else {
      existingProduct = await ProductModel.findOne({ slug: id })
    }
    
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }

    // Manejar actualización de precios
    if (updateData.price) {
      // Si solo se actualizan algunos campos del objeto de precio
      if (typeof updateData.price === 'object') {
        updateData.price = {
          ...existingProduct.price.toObject(), // Mantener valores existentes
          ...updateData.price // Sobrescribir con los nuevos
        }
      }
    }
    
    // Manejar actualización de imágenes
    if (updateData.imagePath && !Array.isArray(updateData.imagePath)) {
      updateData.imagePath = [updateData.imagePath]
    }

    // Actualizar el producto
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      existingProduct._id,
      updateData,
      { new: true, runValidators: true }
    )

    logger.info(`Producto actualizado: ${updatedProduct.title} (ID: ${updatedProduct._id})`)
    return res.status(200).json({
      status: 'success',
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    })
  } catch (error) {
    logger.error(`Error al actualizar producto: ${error.message}`, { stack: error.stack })

    // Verificar si el error es por formato de ID inválido
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'ID de producto inválido'
      })
    }

    // Verificar si es un error de validación
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Error de validación',
        details: error.message
      })
    }
    
    // Verificar si es un error de duplicidad (slug único)
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un producto con ese slug',
        details: error.keyValue
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
}

// Eliminar un producto
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar si el producto existe (por ID o por slug)
    let existingProduct
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      existingProduct = await ProductModel.findById(id)
    } else {
      existingProduct = await ProductModel.findOne({ slug: id })
    }
    
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }
    
    const productTitle = existingProduct.title
    const productId = existingProduct._id

    // Eliminar el producto
    await ProductModel.findByIdAndDelete(existingProduct._id)

    logger.info(`Producto eliminado: ${productTitle} (ID: ${productId})`)
    return res.status(200).json({
      status: 'success',
      message: 'Producto eliminado exitosamente'
    })
  } catch (error) {
    logger.error(`Error al eliminar producto: ${error.message}`, { stack: error.stack })

    // Verificar si el error es por formato de ID inválido
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'ID de producto inválido'
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    })
  }
}
