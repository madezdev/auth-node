/**
 * User DTO for safely transferring user data to the client
 */
export class UserDTO {
  constructor (user) {
    this.id = user._id
    this.firstName = user.first_name
    this.lastName = user.last_name
    this.email = user.email
    this.age = user.age
    this.role = user.role
    this.cart = user.cart

    // Include address if available
    if (user.address) {
      this.address = {
        street: user.address.street,
        city: user.address.city,
        state: user.address.state,
        zipCode: user.address.zipCode
      }
    }

    // Track user activity timestamps without exposing exact times
    if (user.lastLogin) {
      this.lastActive = new Date(user.lastLogin).toISOString().split('T')[0]
    }
  }

  /**
   * Create a DTO for current user endpoint
   * @param {Object} user - User document
   * @returns {Object} - DTO with non-sensitive user data
   */
  static toCurrentUser (user) {
    if (!user) return null

    const dto = {
      id: user._id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      age: user.age,
      role: user.role,
      cart: user.cart
    }

    // Include address if available
    if (user.address) {
      dto.address = {
        street: user.address.street,
        city: user.address.city,
        state: user.address.state,
        zipCode: user.address.zipCode
      }
    }

    // Add last login info if available
    if (user.lastLogin) {
      dto.lastActive = new Date(user.lastLogin).toISOString().split('T')[0]
    }

    return dto
  }

  /**
   * Create a DTO with profile completion status
   * @param {Object} user - User document
   * @param {Object} completionStatus - Object containing completion status
   * @returns {Object} - DTO with completion status
   */
  static withProfileStatus (user, completionStatus) {
    const dto = this.toCurrentUser(user)
    if (!dto) return null

    return {
      ...dto,
      profileStatus: {
        userCompleted: completionStatus.userIsCompleted,
        addressCompleted: completionStatus.addressIsCompleted,
        isComplete: completionStatus.userIsCompleted && completionStatus.addressIsCompleted
      }
    }
  }

  /**
   * Create a DTO for public profile (less information)
   * @param {Object} user - User document
   * @returns {Object} - DTO with minimal user data for public display
   */
  static toPublicProfile (user) {
    if (!user) return null

    return {
      id: user._id,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
      // No email, age, cart, or other personal data
    }
  }
  
  /**
   * Create a DTO for admin view (more information)
   * @param {Object} user - User document
   * @returns {Object} - DTO with additional user data for admins
   */
  static toAdminView (user) {
    if (!user) return null

    const dto = this.toCurrentUser(user)

    // Add additional fields that only admins should see
    return {
      ...dto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      failedLoginAttempts: user.failedLoginAttempts,
      accountLocked: user.accountLocked,
      accountLockedUntil: user.accountLockedUntil
    }
  }
}
