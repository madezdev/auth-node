/* eslint-disable camelcase */
import { ProductModel } from '../models/product.model.js'
import cloudinaryService from '../services/cloudinary.service.js'

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    // Extraer datos del cuerpo
    const {
      title,
      description,
      information,
      product_code,
      supplier,
      characteristics,
      brand,
      model,
      warranty,
      slug,
      origin,
      price,
      iva,
      discount,
      stock,
      category,
      subcategory,
      url
    } = req.body

    // Para multipart/form-data, req.body puede tener múltiples entradas con el mismo nombre
    // lo que Express convierte en arrays, pero si solo hay uno, será un string
    const systemArray = Array.isArray(req.body.system) ? req.body.system : (req.body.system ? [req.body.system] : [])
    const partnerArray = Array.isArray(req.body.partner) ? req.body.partner : (req.body.partner ? [req.body.partner] : [])
    const familyArray = Array.isArray(req.body.family) ? req.body.family : (req.body.family ? [req.body.family] : [])
    const tagsArray = Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? [req.body.tags] : [])

    const uploadedImages = []
    const uploadedFiles = []

    // Validar datos obligatorios
    if (!title || !description || !information || !product_code || !supplier ||
        !characteristics || !brand || !model || !warranty || !slug || !origin ||
        !price || !category || !subcategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios para el producto'
      })
    }

    // Procesar imágenes si existen
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        try {
          // Subir cada imagen a Cloudinary en la carpeta de productos/imágenes
          const result = await cloudinaryService.uploadFile(
            file.path,
            'products/images',
            'image'
          )
          // Formatear y guardar el resultado
          uploadedImages.push(cloudinaryService.formatCloudinaryResult(result))
        } catch (uploadError) {
          console.error('Error al subir imagen:', uploadError)
          // Continuar con las siguientes imágenes
        }
      }
    }

    // Procesar archivos si existen
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        try {
          // Subir cada archivo a Cloudinary en la carpeta de productos/files
          const result = await cloudinaryService.uploadFile(
            file.path,
            'products/files',
            'raw' // o 'auto' para detección automática
          )
          // Formatear y guardar el resultado
          uploadedFiles.push(cloudinaryService.formatCloudinaryResult(result))
        } catch (uploadError) {
          console.error('Error al subir archivo:', uploadError)
          // Continuar con los siguientes archivos
        }
      }
    }

    // Establecer la imagen principal (primera imagen o placeholder)
    const mainImage = uploadedImages.length > 0
      ? uploadedImages[0].secure_url
      : 'https://via.placeholder.com/150'

    // Preparar las características utilizando la estructura Map
    const characteristicsMap = {
      properties: new Map()
    }

    // Si se proporciona un objeto de características, convertirlo a Map
    if (characteristics && typeof characteristics === 'object') {
      Object.entries(characteristics).forEach(([key, value]) => {
        characteristicsMap.properties.set(key, value)
      })
    }
    // Crear el producto con las imágenes y archivos
    const newProduct = await ProductModel.create({
      title,
      description,
      information,
      product_code,
      supplier,
      characteristics: characteristicsMap,
      brand,
      model,
      warranty,
      slug,
      origin,
      price,
      iva: iva || 0,
      discount: discount || false,
      stock: stock || 0,
      category,
      subcategory,
      system: systemArray,
      partner: partnerArray,
      family: familyArray,
      tags: tagsArray,
      url,
      main_image: mainImage,
      images: uploadedImages,
      files: uploadedFiles
    })

    return res.status(201).json({
      status: 'success',
      message: 'Producto creado exitosamente',
      product: newProduct
    })
  } catch (error) {
    console.error('Error al crear producto:', error)
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
    const filter = {}

    // Filtrado por campos comunes
    const filterFields = [
      'category', 'subcategory', 'brand', 'supplier',
      'origin', 'model', 'product_code', 'slug'
    ]

    filterFields.forEach(field => {
      if (req.query[field]) {
        filter[field] = req.query[field]
      }
    })

    // Filtros para campos de array
    const arrayFields = ['system', 'partner', 'family', 'tags']
    arrayFields.forEach(field => {
      if (req.query[field]) {
        filter[field] = { $in: [req.query[field]] }
      }
    })

    // Filtro de precios
    if (req.query.minPrice) {
      filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice) }
    }
    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) }
    }

    // Filtrar por descuento
    if (req.query.discount === 'true') {
      filter.discount = true
    }

    // Ordenamiento
    let sortOptions = {}
    if (req.query.sort) {
      // format: "field:order" - ejemplo: "price:desc"
      const [field, order] = req.query.sort.split(':')
      sortOptions[field] = order === 'desc' ? -1 : 1
    } else {
      // Por defecto, ordenar por fecha de creación descendente
      sortOptions = { createdAt: -1 }
    }

    // Ejecutar la consulta
    const products = await ProductModel.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    // Contar total de productos para la paginación
    const total = await ProductModel.countDocuments(filter)

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
    console.error('Error al obtener productos:', error)
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
    const product = await ProductModel.findById(id)

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }

    return res.status(200).json({
      status: 'success',
      product
    })
  } catch (error) {
    console.error('Error al obtener producto:', error)

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
    const uploadedImages = []
    const uploadedFiles = []
    const productUpdates = { ...updateData }

    // Procesar las características si se han proporcionado
    if (updateData.characteristics && typeof updateData.characteristics === 'object') {
      // Crear un nuevo objeto para las propiedades del Map
      const characteristicsMap = {
        properties: new Map()
      }

      // Convertir el objeto de características en entradas para el Map
      Object.entries(updateData.characteristics).forEach(([key, value]) => {
        characteristicsMap.properties.set(key, value)
      })

      // Reemplazar el objeto de características original con el Map
      productUpdates.characteristics = characteristicsMap
    }

    // Verificar si el producto existe
    const existingProduct = await ProductModel.findById(id)
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }

    // Procesar imágenes si existen en la solicitud
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        try {
          // Subir cada imagen a Cloudinary
          const result = await cloudinaryService.uploadFile(
            file.path,
            'products/images',
            'image'
          )
          // Formatear y guardar el resultado
          uploadedImages.push(cloudinaryService.formatCloudinaryResult(result))
        } catch (uploadError) {
          console.error('Error al subir imagen:', uploadError)
        }
      }

      // Si hay nuevas imágenes, actualizar el array de imágenes del producto
      if (uploadedImages.length > 0) {
        // Combinar imágenes existentes con las nuevas
        productUpdates.images = [...(existingProduct.images || []), ...uploadedImages]

        // Actualizar la imagen principal si es necesario
        if (!existingProduct.main_image || existingProduct.main_image === 'https://via.placeholder.com/150') {
          productUpdates.main_image = uploadedImages[0].secure_url
        }
      }
    }

    // Procesar archivos si existen en la solicitud
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        try {
          // Subir cada archivo a Cloudinary
          const result = await cloudinaryService.uploadFile(
            file.path,
            'products/files',
            'raw'
          )
          // Formatear y guardar el resultado
          uploadedFiles.push(cloudinaryService.formatCloudinaryResult(result))
        } catch (uploadError) {
          console.error('Error al subir archivo:', uploadError)
        }
      }

      // Si hay nuevos archivos, actualizar el array de archivos del producto
      if (uploadedFiles.length > 0) {
        productUpdates.files = [...(existingProduct.files || []), ...uploadedFiles]
      }
    }

    // Actualizar el producto
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      productUpdates,
      { new: true, runValidators: true }
    )

    return res.status(200).json({
      status: 'success',
      message: 'Producto actualizado exitosamente',
      product: updatedProduct
    })
  } catch (error) {
    console.error('Error al actualizar producto:', error)

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

    // Verificar si el producto existe
    const existingProduct = await ProductModel.findById(id)
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }

    // Eliminar el producto
    await ProductModel.findByIdAndDelete(id)

    return res.status(200).json({
      status: 'success',
      message: 'Producto eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar producto:', error)

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
