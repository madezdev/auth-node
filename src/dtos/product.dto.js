/**
 * Product DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of Product documents to client-safe objects
 */

/**
 * Creates a DTO for product data with all necessary information for display
 * 
 * @param {Object} product - The product document from the database
 * @returns {Object} A cleaned product object safe for client-side use
 */
export const createProductDTO = (product) => {
  if (!product) {
    return null;
  }
  
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    image: product.image,
    createdAt: product.createdAt || product.created_at,
    updatedAt: product.updatedAt || product.updated_at
  };
};

/**
 * Creates a list DTO for products with minimal information for list displays
 * 
 * @param {Object} product - The product document from the database
 * @returns {Object} A minimal product object for list views
 */
export const createProductListDTO = (product) => {
  if (!product) {
    return null;
  }
  
  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    inStock: product.stock > 0
  };
};

/**
 * Transform an array of products to DTOs
 * 
 * @param {Array} products - Array of product documents
 * @param {Function} dtoFunction - DTO function to apply (defaults to createProductDTO)
 * @returns {Array} Array of product DTOs
 */
export const createProductsDTO = (products, dtoFunction = createProductDTO) => {
  if (!products || !Array.isArray(products)) {
    return [];
  }
  
  return products.map(product => dtoFunction(product));
};
