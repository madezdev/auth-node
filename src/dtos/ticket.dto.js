/**
 * Ticket DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of Ticket documents to client-safe objects
 */
import { createProductDTO } from './product.dto.js';
import { createPublicUserDTO } from './user.dto.js';

/**
 * Creates a DTO for ticket data with purchased products information
 * 
 * @param {Object} ticket - The ticket document from the database
 * @returns {Object} A cleaned ticket object safe for client-side use
 */
export const createTicketDTO = (ticket) => {
  if (!ticket) {
    return null;
  }
  
  const result = {
    id: ticket._id.toString(),
    code: ticket.code,
    purchaseDate: ticket.purchase_datetime,
    amount: ticket.amount,
    purchaser: ticket.purchaser,
    status: ticket.status,
    products: []
  };
  
  // Add user information if populated
  if (ticket.user && typeof ticket.user === 'object') {
    result.user = createPublicUserDTO(ticket.user);
  } else if (ticket.user) {
    result.userId = ticket.user.toString();
  }
  
  // Process purchased products
  if (ticket.products && Array.isArray(ticket.products)) {
    result.products = ticket.products.map(item => {
      const product = {
        id: item.product?.toString() || item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      };
      
      // If product is populated (mongoose object)
      if (item.product && typeof item.product === 'object') {
        product.details = createProductDTO(item.product);
      }
      
      return product;
    });
  }
  
  // Process failed products if any
  if (ticket.failed_products && ticket.failed_products.length > 0) {
    result.failedProducts = ticket.failed_products.map(item => {
      const product = {
        id: item.product?.toString() || item.product,
        name: item.name,
        price: item.price,
        availableQuantity: item.quantity,
        requestedQuantity: item.requested_quantity
      };
      
      // If product is populated (mongoose object)
      if (item.product && typeof item.product === 'object') {
        product.details = createProductDTO(item.product);
      }
      
      return product;
    });
  }
  
  return result;
};

/**
 * Creates a list of ticket DTOs
 * 
 * @param {Array} tickets - Array of ticket documents
 * @returns {Array} Array of ticket DTOs
 */
export const createTicketsDTO = (tickets) => {
  if (!tickets || !Array.isArray(tickets)) {
    return [];
  }
  
  return tickets.map(ticket => createTicketDTO(ticket));
};
