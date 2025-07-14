/**
 * Order DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of Order documents to client-safe objects
 */

/**
 * Creates a DTO for order data with all necessary information
 * 
 * @param {Object} order - The order document from the database
 * @returns {Object} A cleaned order object safe for client-side use
 */
export const createOrderDTO = (order) => {
  if (!order) {
    return null;
  }
  
  // Basic order data
  const orderDTO = {
    id: order._id.toString(),
    code: order.code,
    status: order.status,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    products: order.products.map(item => ({
      id: item.product.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    })),
    shippingAddress: order.shippingAddress,
    paymentInfo: {
      method: order.paymentInfo?.method
    }
  };

  // Add user information if populated
  if (order.user) {
    if (typeof order.user === 'object') {
      orderDTO.user = {
        id: order.user._id.toString(),
        name: `${order.user.first_name} ${order.user.last_name}`,
        email: order.user.email
      };
    } else {
      orderDTO.userId = order.user.toString();
    }
  }
  
  return orderDTO;
};

/**
 * Creates a list DTO for orders with minimal information
 * 
 * @param {Object} order - The order document from the database
 * @returns {Object} A minimal order object for list views
 */
export const createOrderListDTO = (order) => {
  if (!order) {
    return null;
  }
  
  return {
    id: order._id.toString(),
    code: order.code,
    status: order.status,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate || order.createdAt,
    itemCount: order.products.length,
    userName: order.user?.first_name ? `${order.user.first_name} ${order.user.last_name}` : null
  };
};

/**
 * Transform an array of orders to DTOs
 * 
 * @param {Array} orders - Array of order documents
 * @param {Function} dtoFunction - DTO function to apply (defaults to createOrderDTO)
 * @returns {Array} Array of order DTOs
 */
export const createOrdersDTO = (orders, dtoFunction = createOrderDTO) => {
  if (!orders || !Array.isArray(orders)) {
    return [];
  }
  
  return orders.map(order => dtoFunction(order));
};
