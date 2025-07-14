import { BaseDao } from './base.dao.js';
import { UserModel } from '../models/user.model.js';
import logger from '../config/logger.config.js';

/**
 * User DAO - Data Access Object for User operations
 * Extends BaseDao to provide specific functionality for user data
 */
export class UserDao extends BaseDao {
  constructor() {
    super(UserModel);
    logger.debug('UserDao initialized');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User>} User document
   */
  async findByEmail(email) {
    try {
      return await this.model.findOne({ email });
    } catch (error) {
      logger.error(`Error in UserDao.findByEmail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user profile information is complete
   * @param {string} userId - User ID
   * @returns {Promise<{userIsCompleted: boolean, addressIsCompleted: boolean}>}
   */
  async checkProfileCompletion(userId) {
    try {
      const user = await this.getById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if all required user personal info is complete
      const userIsCompleted = !!(
        user.first_name && 
        user.last_name && 
        user.email && 
        user.age
      );

      // Check if address information is complete
      // Assuming address fields are part of the user document
      const addressIsCompleted = !!(
        user.address && 
        user.address.street && 
        user.address.city &&
        user.address.state &&
        user.address.zipCode
      );

      return {
        userIsCompleted,
        addressIsCompleted
      };
    } catch (error) {
      logger.error(`Error in UserDao.checkProfileCompletion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user's role based on profile completion
   * @param {string} userId - User ID
   */
  async updateUserRole(userId) {
    try {
      const { userIsCompleted, addressIsCompleted } = await this.checkProfileCompletion(userId);
      
      // If all information is complete, promote from 'guest' to 'user'
      if (userIsCompleted && addressIsCompleted) {
        const user = await this.getById(userId);
        
        if (user && user.role === 'guest') {
          await this.update(userId, { role: 'user' });
          logger.info(`User ${userId} promoted from 'guest' to 'user'`);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error(`Error in UserDao.updateUserRole: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password (will be hashed by the model's pre-save hook)
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(userId, newPassword) {
    try {
      const user = await this.getById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if new password is the same as current password
      if (user.isValidPassword(newPassword)) {
        return { updated: false, message: 'New password cannot be the same as current password' };
      }

      user.password = newPassword;
      await user.save(); // This will trigger the password hash pre-save hook
      
      return { updated: true, message: 'Password updated successfully' };
    } catch (error) {
      logger.error(`Error in UserDao.updatePassword: ${error.message}`);
      throw error;
    }
  }
}
