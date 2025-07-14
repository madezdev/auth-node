import { BaseRepository } from './base.repository.js';
import { UserDao } from '../daos/user.dao.js';
import { createUserDTO } from '../dtos/user.dto.js';
import logger from '../config/logger.config.js';

/**
 * User Repository
 * Implements specific business logic for user operations
 */
export class UserRepository extends BaseRepository {
  constructor() {
    const userDao = new UserDao();
    super(userDao);
    logger.debug('UserRepository initialized');
  }

  /**
   * Get all users with sensitive data removed
   * @returns {Promise<Array>} List of user DTOs
   */
  async getAllUsers() {
    try {
      const users = await this.dao.getAll();
      return users.map(user => createUserDTO(user));
    } catch (error) {
      logger.error(`Error in UserRepository.getAllUsers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by ID with sensitive data removed
   * @param {string} id - User ID
   * @returns {Promise<Object>} User DTO
   */
  async getUserById(id) {
    try {
      const user = await this.dao.getById(id);
      return user ? createUserDTO(user) : null;
    } catch (error) {
      logger.error(`Error in UserRepository.getUserById: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by email with sensitive data removed
   * @param {string} email - User email
   * @returns {Promise<Object>} User DTO
   */
  async getUserByEmail(email) {
    try {
      const user = await this.dao.findByEmail(email);
      return user ? createUserDTO(user) : null;
    } catch (error) {
      logger.error(`Error in UserRepository.getUserByEmail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get complete user by email including sensitive data (for authentication)
   * @param {string} email - User email
   * @returns {Promise<Object>} Complete user document
   */
  async getCompleteUserByEmail(email) {
    try {
      return await this.dao.findByEmail(email);
    } catch (error) {
      logger.error(`Error in UserRepository.getCompleteUserByEmail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new user and return DTO
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user DTO
   */
  async createUser(userData) {
    try {
      // Set default role to guest
      const userWithRole = {
        ...userData,
        role: userData.role || 'guest'
      };
      
      const user = await this.dao.create(userWithRole);
      return createUserDTO(user);
    } catch (error) {
      logger.error(`Error in UserRepository.createUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user DTO
   */
  async updateUser(id, userData) {
    try {
      const user = await this.dao.update(id, userData);
      
      // Check profile completion and update role if needed
      await this.dao.updateUserRole(id);
      
      return user ? createUserDTO(user) : null;
    } catch (error) {
      logger.error(`Error in UserRepository.updateUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user's profile is complete and update role if needed
   * @param {string} id - User ID
   * @returns {Promise<Object>} Profile completion status
   */
  async checkAndUpdateUserRole(id) {
    try {
      const { userIsCompleted, addressIsCompleted } = await this.dao.checkProfileCompletion(id);
      const roleUpdated = await this.dao.updateUserRole(id);
      
      return {
        userIsCompleted,
        addressIsCompleted,
        roleUpdated
      };
    } catch (error) {
      logger.error(`Error in UserRepository.checkAndUpdateUserRole: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   * @param {string} currentPassword - Current password for verification
   * @returns {Promise<Object>} Password update result
   */
  async updatePassword(id, newPassword, currentPassword) {
    try {
      // Get user for password verification
      const user = await this.dao.getById(id);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Verify current password
      if (currentPassword && !user.isValidPassword(currentPassword)) {
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Update password
      const result = await this.dao.updatePassword(id, newPassword);
      return {
        success: result.updated,
        message: result.message
      };
    } catch (error) {
      logger.error(`Error in UserRepository.updatePassword: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
