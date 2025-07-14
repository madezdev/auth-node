import { BaseRepository } from './base.repository.js'
import { UserModel } from '../models/user.model.js'
import logger from '../config/logger.config.js'

/**
 * Repository for User-related database operations
 */
export class UserRepository extends BaseRepository {
  constructor () {
    super(UserModel)
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @returns {Promise} - User document or null
   */
  async findByEmail (email) {
    logger.debug(`UserRepository: Finding user by email ${email}`)
    return this.model.findOne({ email })
  }

  /**
   * Check if user profile is complete
   * @param {String} userId - User ID
   * @returns {Object} - Object with profile completion status
   */
  async checkProfileCompletion (userId) {
    logger.debug(`UserRepository: Checking profile completion for user ${userId}`)
    const user = await this.findById(userId)
    // Check if user personal information is complete
    const userIsCompleted = !!(
      user.first_name &&
      user.last_name &&
      user.email &&
      user.age
    )

    // Check if address information is complete
    const addressIsCompleted = !!(
      user.address &&
      user.address.street &&
      user.address.city &&
      user.address.state &&
      user.address.zipCode
    )

    return { userIsCompleted, addressIsCompleted }
  }

  /**
   * Update user role
   * @param {String} userId - User ID
   * @param {String} newRole - New role to assign
   * @returns {Object} - Updated user document
   */
  async updateRole (userId, newRole) {
    logger.info(`UserRepository: Updating role for user ${userId} to ${newRole}`)
    const user = await this.findById(userId)
    if (!user) return null

    const { userIsCompleted, addressIsCompleted } = await this.checkProfileCompletion(userId)

    // If both user and address info are complete, upgrade from guest to user role
    if (user.role === 'guest' && userIsCompleted && addressIsCompleted) {
      user.role = 'user'
      return await this.updateOne(user._id, { role: 'user' })
    }

    return user
  }

  /**
   * Create password reset token
   * @param {String} userId - User ID
   * @param {String} token - Reset token
   * @param {Date} expires - Token expiration date
   * @returns {Promise} - Updated user
   */
  /**
   * Create password reset token for a user
   * @param {String} userId - User ID
   * @param {String} token - Reset token
   * @param {Date} expires - Token expiration date
   * @returns {Object} - Updated user document
   */
  async createPasswordResetToken (userId, token, expires) {
    logger.info(`UserRepository: Creating password reset token for user ${userId}`)
    return this.model.findByIdAndUpdate(
      userId,
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      },
      { new: true }
    )
  }

  /**
   * Find user by reset token
   * @param {String} token - Reset token
   * @returns {Promise} - User document or null
   */
  /**
   * Find user by reset token
   * @param {String} token - Reset token
   * @returns {Object} - User document or null
   */
  async findByResetToken (token) {
    logger.debug('UserRepository: Finding user by reset token')
    return this.model.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })
  }

  /**
   * Clear password reset token
   * @param {String} userId - User ID
   * @returns {Promise} - Updated user
   */
  async clearPasswordResetToken (userId) {
    return this.model.findByIdAndUpdate(
      userId,
      {
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1
        }
      },
      { new: true }
    )
  }
}
