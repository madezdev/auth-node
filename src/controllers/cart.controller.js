import { CartModel } from '../models/cart.model.js'
import mongoose from 'mongoose'
import logger from '../config/logger.config.js'

// Crear un nuevo carrito
export const createCart = async (req, res) => {
  try {
    logger.debug('Iniciando creación de nuevo carrito')
    const newCart = await CartModel.create({})

    logger.info(`Carrito creado exitosamente: ID ${newCart._id}`)
    return res.status(201).json(newCart)
  } catch (error) {
    logger.error(`Error al crear carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the cart',
      error: error.message
    })
  }
}

// Obtener carrito por ID
export const getCartById = async (req, res) => {
  try {
    const { id } = req.params
    logger.debug(`Buscando carrito por ID: ${id}`)
    const cart = await CartModel.findById(id)

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    return res.status(200).json(cart)
  } catch (error) {
    logger.error(`Error al recuperar carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving the cart',
      error: error.message
    })
  }
}

// Agregar producto al carrito
export const addProductToCart = async (req, res) => {
  try {
    const { id, pid } = req.params
    const { quantity = 1 } = req.body

    logger.debug(`Agregando producto ${pid} al carrito ${id} (cantidad: ${quantity})`)

    const cart = await CartModel.findById(id)
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    // Verificar si el producto ya existe en el carrito
    const existingProductIndex = cart.products.findIndex(
      item => item.product.toString() === pid
    )

    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      cart.products[existingProductIndex].quantity += quantity
      logger.debug(`Producto ${pid} ya existía en el carrito, actualizado a cantidad: ${cart.products[existingProductIndex].quantity}`)
    } else {
      // Add new product to cart
      cart.products.push({
        product: pid,
        quantity
      })
      logger.debug(`Nuevo producto ${pid} agregado al carrito con cantidad: ${quantity}`)
    }

    await cart.save()
    return res.status(200).json(cart)
  } catch (error) {
    logger.error(`Error al agregar producto al carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while adding the product to cart',
      error: error.message
    })
  }
}

// Actualizar cantidad de producto en carrito
export const updateProductQuantity = async (req, res) => {
  try {
    const { id, pid } = req.params
    const { quantity } = req.body

    logger.debug(`Actualizando cantidad del producto ${pid} en carrito ${id} a ${quantity}`)

    if (!quantity || quantity < 1) {
      logger.warn(`Intento de actualizar producto con cantidad inválida: ${quantity}`)
      return res.status(400).json({
        status: 'error',
        message: 'Invalid quantity value'
      })
    }

    const cart = await CartModel.findById(id)
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    const existingProductIndex = cart.products.findIndex(
      item => item.product.toString() === pid
    )

    if (existingProductIndex === -1) {
      logger.warn(`Producto ${pid} no encontrado en el carrito ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'Product not found in cart'
      })
    }

    cart.products[existingProductIndex].quantity = quantity
    await cart.save()

    logger.info(`Cantidad del producto ${pid} actualizada exitosamente a ${quantity} en carrito ${id}`)
    return res.status(200).json(cart)
  } catch (error) {
    logger.error(`Error al actualizar cantidad del producto en carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the product quantity',
      error: error.message
    })
  }
}

// Eliminar producto del carrito
export const removeProductFromCart = async (req, res) => {
  try {
    const { id, pid } = req.params

    logger.debug(`Eliminando producto ${pid} del carrito ${id}`)

    const cart = await CartModel.findById(id)
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    // Filtrar el producto para eliminar
    const originalLength = cart.products.length
    cart.products = cart.products.filter(
      item => item.product.toString() !== pid
    )

    const wasRemoved = originalLength > cart.products.length
    if (!wasRemoved) {
      logger.warn(`Producto ${pid} no encontrado en el carrito ${id} para eliminar`)
    }

    await cart.save()
    return res.status(200).json(cart)
  } catch (error) {
    logger.error(`Error al eliminar producto del carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while removing the product from cart',
      error: error.message
    })
  }
}

// Vaciar carrito
export const emptyCart = async (req, res) => {
  try {
    const { id } = req.params

    logger.debug(`Vaciando carrito ${id}`)

    const cart = await CartModel.findById(id)
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    const previousCount = cart.products.length
    cart.products = []
    await cart.save()

    logger.info(`Carrito ${id} vaciado exitosamente. ${previousCount} productos eliminados`)
    return res.status(200).json(cart)
  } catch (error) {
    logger.error(`Error al vaciar carrito: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while emptying the cart',
      error: error.message
    })
  }
}

// Procesar checkout
export const processCheckout = async (req, res) => {
  try {
    const { id } = req.params

    logger.debug(`Iniciando proceso de checkout para carrito ${id}`)

    const cart = await CartModel.findById(id).populate('products.product')
    if (!cart) {
      logger.warn(`Intento de checkout con carrito inexistente: ${id}`)
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found'
      })
    }

    // 1. Verificar disponibilidad/stock de productos
    const productsNotAvailable = []
    let totalAmount = 0

    for (const item of cart.products) {
      const product = item.product
      if (!product) {
        productsNotAvailable.push('Producto no encontrado')
        continue
      }

      // Simulamos verificación de stock
      const inStock = product.stock >= item.quantity
      if (!inStock) {
        productsNotAvailable.push({
          productId: product._id,
          name: product.name || 'Producto',
          requestedQuantity: item.quantity,
          availableQuantity: product.stock || 0
        })
      } else {
        // Calculamos el total
        totalAmount += (product.price || 0) * item.quantity
      }
    }

    if (productsNotAvailable.length > 0) {
      logger.warn(`Checkout fallido para carrito ${id}: productos no disponibles`, { productsNotAvailable })
      return res.status(400).json({
        status: 'error',
        message: 'Algunos productos no están disponibles',
        productsNotAvailable
      })
    }

    // 2. Crear un pedido
    const orderId = new mongoose.Types.ObjectId()
    const order = {
      _id: orderId,
      userId: req.user._id,
      products: cart.products.map(item => ({
        productId: item.product._id,
        name: item.product.name || 'Producto',
        price: item.product.price || 0,
        quantity: item.quantity
      })),
      totalAmount,
      status: 'pending',
      createdAt: new Date()
    }

    // 3. Procesar el pago (simulado)
    const paymentSuccessful = true // En un caso real, esto vendría de un procesador de pagos

    if (!paymentSuccessful) {
      logger.warn(`Checkout fallido para carrito ${id}: error en el procesamiento del pago`)
      return res.status(400).json({
        status: 'error',
        message: 'Error en el procesamiento del pago'
      })
    }

    // 4. Actualizar inventario (simulado)
    // En un caso real, actualizaríamos el stock en la base de datos
    // para cada producto en el carrito

    // Vaciar el carrito después de un checkout exitoso
    cart.products = []
    await cart.save()

    logger.info(`Checkout completado exitosamente para orden ${orderId}. Total: ${totalAmount}`)

    return res.status(200).json({
      status: 'success',
      message: 'Checkout procesado correctamente',
      orderId: orderId.toString(),
      order
    })
  } catch (error) {
    logger.error(`Error durante el checkout: ${error.message}`, { stack: error.stack })
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during checkout',
      error: error.message
    })
  }
}
