/**
 * Cart DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of Cart documents to client-safe objects
 */
import { createProductDTO } from './product.dto.js';

/**
 * Creates a DTO for cart data with products information
 * 
 * @param {Object} cart - The cart document from the database
 * @returns {Object} A cleaned cart object safe for client-side use
 */
export const createCartDTO = (cart) => {
  if (!cart) {
    return null;
  }
  
  // Calculate cart total
  let total = 0;
  const cartItems = [];
  
  // Process cart items
  if (cart.products && Array.isArray(cart.products)) {
    cart.products.forEach(item => {
      // If product is populated (mongoose object)
      if (item.product && typeof item.product === 'object') {
        const productDTO = createProductDTO(item.product);
        const itemTotal = item.quantity * item.product.price;
        total += itemTotal;
        
        cartItems.push({
          product: productDTO,
          quantity: item.quantity,
          subtotal: itemTotal
        });
      } else {
        // If product is just an ID (not populated)
        cartItems.push({
          product: item.product.toString(),
          quantity: item.quantity
        });
      }
    });
  }
  
  return {
    id: cart._id.toString(),
    items: cartItems,
    totalItems: cartItems.length,
    totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    total: total,
    createdAt: cart.createdAt || cart.created_at,
    updatedAt: cart.updatedAt || cart.updated_at
  };
};

/**
 * Creates a minimal cart DTO with just summary information
 * 
 * @param {Object} cart - The cart document from the database
 * @returns {Object} A minimal cart summary
 */
export const createCartSummaryDTO = (cart) => {
  if (!cart) {
    return null;
  }
  
  let totalQuantity = 0;
  
  if (cart.products && Array.isArray(cart.products)) {
    totalQuantity = cart.products.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  return {
    id: cart._id.toString(),
    totalItems: cart.products?.length || 0,
    totalQuantity: totalQuantity
  };
};
