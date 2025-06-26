import { ProductModel } from '../models/product.model.js'

// Crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body

    // Validar datos obligatorios
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios (name, description, price, category)'
      })
    }

    // Crear el producto
    const newProduct = await ProductModel.create({
      name,
      description,
      price,
      stock: stock || 0,
      category,
      image: image || 'https://via.placeholder.com/150'
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
    if (req.query.category) {
      filter.category = req.query.category
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

    // Verificar si el producto existe
    const existingProduct = await ProductModel.findById(id)
    if (!existingProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      })
    }

    // Actualizar el producto
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateData,
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
