import logger from '../config/logger.config.js'
import { OrderDao } from '../daos/order.dao.js'
import { UserDao } from '../daos/user.dao.js'
import { ShippingAddressDao } from '../daos/shipping-address.dao.js'
import { createOrderDTO, createOrdersDTO, createOrderListDTO } from '../dtos/order.dto.js'
import { UserRoleService } from '../services/user-role.service.js'
import { emailService } from '../services/email.service.js'

/**
 * Order Controller
 * Handles operations related to user orders
 */
export class OrderController {
  constructor () {
    this.orderDao = new OrderDao()
    this.userDao = new UserDao()
    this.shippingAddressDao = new ShippingAddressDao()
  }

  /**
   * Create a new order from cart
   */
  async createOrder (req, res) {
    try {
      const userId = req.user.id
      const { cartItems, totalAmount, shippingAddressId, paymentInfo } = req.body

      logger.info(`Creating new order for user: ${userId}`)

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cart items are required'
        })
      }

      // Obtener la dirección de envío del usuario
      let shippingAddress
      if (shippingAddressId) {
        // Si se proporciona un ID de dirección específico, usar esa dirección
        const addressFromDb = await this.shippingAddressDao.getById(shippingAddressId)
        if (!addressFromDb || addressFromDb.user.toString() !== userId) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid shipping address selected'
          })
        }
        shippingAddress = addressFromDb
      } else {
        // Si no se proporciona ID, usar la dirección por defecto
        logger.info(`Looking for default address for user: ${userId}`)
        const defaultAddress = await this.shippingAddressDao.getDefaultByUserId(userId)
        logger.info('Default address found:', defaultAddress)
        if (!defaultAddress) {
          return res.status(400).json({
            status: 'error',
            message: 'No default shipping address found. Please add a shipping address.'
          })
        }
        shippingAddress = defaultAddress
      }

      // Format products for order
      logger.info('Cart items:', cartItems)
      const products = cartItems.map(item => {
        logger.info('Processing item:', item)
        return {
          product: item.product._id || item.product,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        }
      })

      // Formatear la dirección de envío en snake_case para la base de datos
      const formattedShippingAddress = {
        state: shippingAddress.state,
        street: shippingAddress.street,
        postal_code: shippingAddress.postal_code,
        country: shippingAddress.country,
        apt: shippingAddress.apt,
        locality: shippingAddress.locality,
        details: shippingAddress.details
      }

      // Create the order
      const orderData = {
        user: userId,
        totalAmount,
        products,
        shippingAddress: formattedShippingAddress,
        paymentInfo,
        status: 'pending'
      }

      const newOrder = await this.orderDao.createFromCart(orderData)

      // Get user email for notification
      const user = await this.userDao.getById(userId)
      if (user && user.email) {
        await emailService.sendOrderStatusUpdate(user.email, newOrder)
      }
      
      // Verificar y actualizar el rol del usuario si es necesario
      await UserRoleService.updateRoleBasedOnCompletion(userId)
      return res.status(201).json({
        status: 'success',
        payload: createOrderDTO(newOrder)
      })
    } catch (error) {
      logger.error(`Error creating order: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create order'
      })
    }
  }

  /**
   * Get all orders for current user
   */
  async getUserOrders (req, res) {
    try {
      const userId = req.user.id
      logger.info(`Fetching orders for user: ${userId}`)

      const orders = await this.orderDao.getByUserId(userId)
      return res.status(200).json({
        status: 'success',
        payload: createOrdersDTO(orders, createOrderListDTO)
      })
    } catch (error) {
      logger.error(`Error fetching user orders: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch orders'
      })
    }
  }

  /**
   * Get a specific order
   */
  async getOrderById (req, res) {
    try {
      const { orderId } = req.params
      const userId = req.user.id

      logger.info(`Fetching order ${orderId} for user: ${userId}`)

      const order = await this.orderDao.getById(orderId)

      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        })
      }

      // Check if user is authorized to view this order
      if (req.user.role !== 'admin' && order.user.toString() !== userId) {
        logger.warn(`User ${userId} attempted to access order ${orderId} that doesn't belong to them`)
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to view this order'
        })
      }

      return res.status(200).json({
        status: 'success',
        payload: createOrderDTO(order)
      })
    } catch (error) {
      logger.error(`Error fetching order: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order'
      })
    }
  }

  /**
   * Get all orders (admin only)
   */
  async getAllOrders (req, res) {
    try {
      logger.info('Admin fetching all orders')

      const { status } = req.query
      let orders

      if (status && ['pending', 'processing', 'canceled', 'delivered'].includes(status)) {
        orders = await this.orderDao.getByStatus(status)
      } else {
        orders = await this.orderDao.getAll({}, { sort: { createdAt: -1 } })
      }

      return res.status(200).json({
        status: 'success',
        payload: createOrdersDTO(orders, createOrderListDTO)
      })
    } catch (error) {
      logger.error(`Error fetching all orders: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch orders'
      })
    }
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus (req, res) {
    try {
      const { orderId } = req.params
      const { status } = req.body
      const adminId = req.user.id

      logger.info(`Admin ${adminId} updating order ${orderId} status to: ${status}`)

      if (!status || !['pending', 'processing', 'canceled', 'delivered'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status value'
        })
      }

      const updatedOrder = await this.orderDao.updateStatus(orderId, status)

      if (!updatedOrder) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        })
      }

      // Get user email and send notification
      const user = await this.userDao.getById(updatedOrder.user)
      if (user && user.email) {
        await emailService.sendOrderStatusUpdate(user.email, updatedOrder)
        logger.info(`Order status update email sent to ${user.email}`)
      }

      return res.status(200).json({
        status: 'success',
        payload: createOrderDTO(updatedOrder)
      })
    } catch (error) {
      logger.error(`Error updating order status: ${error.message}`, { stack: error.stack })
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update order status'
      })
    }
  }
}

// Export a singleton instance
export const orderController = new OrderController()
