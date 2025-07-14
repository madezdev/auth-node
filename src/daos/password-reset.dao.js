import { BaseDao } from './base.dao.js';
import { PasswordResetModel } from '../models/password-reset.model.js';
import logger from '../config/logger.config.js';

/**
 * PasswordReset DAO - Data Access Object for PasswordReset operations
 * Extends BaseDao to provide specific functionality for password reset tokens
 */
export class PasswordResetDao extends BaseDao {
  constructor() {
    super(PasswordResetModel);
    logger.debug('PasswordResetDao initialized');
  }

  /**
   * Create a new password reset token
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created password reset token document
   */
  async createToken(userId) {
    try {
      // Generate a unique token
      const token = PasswordResetModel.generateToken();
      
      // Create expiration date (1 hour from now)
      const expires = new Date(Date.now() + 3600000);
      
      // Invalidate any existing tokens for this user
      await this.model.updateMany(
        { user: userId, used: false },
        { $set: { used: true } }
      );
      
      // Create new token document
      return await this.model.create({
        user: userId,
        token,
        expires,
        used: false
      });
    } catch (error) {
      logger.error(`Error in PasswordResetDao.createToken: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find valid token by token string
   * @param {string} token - Token string
   * @returns {Promise<Object>} Token document
   */
  async findValidToken(token) {
    try {
      const tokenDoc = await this.model.findOne({
        token,
        used: false,
        expires: { $gt: new Date() }
      }).populate('user');
      
      return tokenDoc;
    } catch (error) {
      logger.error(`Error in PasswordResetDao.findValidToken: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark token as used
   * @param {string} token - Token string
   * @returns {Promise<boolean>} Success status
   */
  async markTokenAsUsed(token) {
    try {
      const result = await this.model.updateOne(
        { token },
        { $set: { used: true } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Error in PasswordResetDao.markTokenAsUsed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of tokens removed
   */
  async cleanupExpiredTokens() {
    try {
      const result = await this.model.deleteMany({
        $or: [
          { used: true },
          { expires: { $lt: new Date() } }
        ]
      });
      
      logger.info(`Cleaned up ${result.deletedCount} expired password reset tokens`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Error in PasswordResetDao.cleanupExpiredTokens: ${error.message}`);
      throw error;
    }
  }
}
