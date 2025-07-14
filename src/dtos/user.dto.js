/**
 * User DTOs (Data Transfer Objects)
 * These DTOs handle the transformation of User documents to client-safe objects,
 * removing sensitive information and transforming properties as needed.
 */

/**
 * Creates a DTO for user data, removing sensitive information and transforming
 * snake_case properties to camelCase for frontend compatibility
 * 
 * @param {Object} user - The user document from the database
 * @returns {Object} A cleaned user object safe for client-side use
 */
export const createUserDTO = (user) => {
  if (!user) {
    return null;
  }
  
  // Create a base DTO with only the necessary fields
  // and convert snake_case to camelCase for frontend
  const userDTO = {
    id: user._id.toString(),
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    age: user.age,
    role: user.role,
    cart: user.cart?.toString(),
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at
  };

  // Add address if it exists
  if (user.address) {
    userDTO.address = {
      street: user.address.street,
      city: user.address.city,
      state: user.address.state,
      zipCode: user.address.zipCode || user.address.zip_code
    };
  }

  return userDTO;
};

/**
 * Creates a public user profile DTO with minimal information
 * for cases where less detail is needed
 * 
 * @param {Object} user - The user document from the database
 * @returns {Object} A minimal user object for public view
 */
export const createPublicUserDTO = (user) => {
  if (!user) {
    return null;
  }
  
  return {
    id: user._id.toString(),
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role
  };
};

/**
 * Creates a current user DTO with all necessary information
 * for the logged-in user
 * 
 * @param {Object} user - The user document from the database
 * @returns {Object} User object with all necessary data for the user session
 */
export const createCurrentUserDTO = (user) => {
  if (!user) {
    return null;
  }
  
  const userDTO = createUserDTO(user);
  
  // Add profile completion flags
  const userIsCompleted = !!(user.first_name && user.last_name && user.email && user.age);
  const addressIsCompleted = !!(
    user.address && 
    user.address.street && 
    user.address.city &&
    user.address.state &&
    user.address.zipCode
  );
  
  return {
    ...userDTO,
    userIsCompleted,
    addressIsCompleted,
    isProfileComplete: userIsCompleted && addressIsCompleted
  };
};
