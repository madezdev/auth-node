/**
 * Helper functions and data for creating valid test data
 */

/**
 * Creates a valid user object for testing
 * @param {Object} overrides - Fields to override in the default user
 * @returns {Object} Valid user object
 */
export const createTestUser = (overrides = {}) => {
  const baseUser = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    birthday: new Date('1990-01-01'),
    identifier: 12345678,
    tax_identifier: 87654321,
    phone: '+1234567890',
    password: 'testpassword123',
    role: 'user'
  }

  return { ...baseUser, ...overrides }
}

/**
 * Creates a valid admin user object for testing
 * @param {Object} overrides - Fields to override in the default admin
 * @returns {Object} Valid admin user object
 */
export const createTestAdmin = (overrides = {}) => {
  return createTestUser({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides
  })
}

/**
 * Creates a valid product object for testing
 * @param {Object} overrides - Fields to override in the default product
 * @returns {Object} Valid product object
 */
export const createTestProduct = (overrides = {}) => {
  const baseProduct = {
    slug: 'test-product',
    title: 'Test Product',
    description: 'Test product description',
    brand: 'Test Brand',
    model: 'Test Model',
    origin: 'Test Origin',
    price: {
      price: 99.99,
      iva: 21,
      isOffer: false
    },
    imagePath: ['test-image.jpg'],
    stock: 50,
    category: 'other'
  }
  
  return { ...baseProduct, ...overrides }
}

/**
 * Creates a unique email for testing to avoid conflicts
 * @param {string} prefix - Prefix for the email
 * @returns {string} Unique email
 */
export const createUniqueEmail = (prefix = 'test') => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}-${timestamp}-${random}@example.com`
}

/**
 * Creates a unique slug for testing to avoid conflicts
 * @param {string} prefix - Prefix for the slug
 * @returns {string} Unique slug
 */
export const createUniqueSlug = (prefix = 'test') => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}-${timestamp}-${random}`
}
