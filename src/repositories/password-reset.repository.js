import { BaseRepository } from './base.repository.js';
import { PasswordResetDao } from '../daos/password-reset.dao.js';
import { userRepository } from './user.repository.js';
import { emailService } from '../services/email.service.js';
import config from '../config/index.js';
import logger from '../config/logger.config.js';

/**
 * Password Reset Repository
 * Implements business logic for password reset operations
 */
export class PasswordResetRepository extends BaseRepository {
  constructor() {
    const passwordResetDao = new PasswordResetDao();
    super(passwordResetDao);
    logger.debug('PasswordResetRepository initialized');
  }

  /**
   * Request a password reset for the specified email
   * @param {string} email - User email
   * @param {string} baseUrl - Base URL for reset link
   * @returns {Promise<Object>} Operation result
   */
  async requestPasswordReset(email, baseUrl) {
    try {
      // Find user by email
      const user = await userRepository.getCompleteUserByEmail(email);
      
      if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email}`);
        return {
          success: false,
          message: 'If a user with that email exists, a password reset link will be sent'
        };
      }
      
      // Create token
      const resetToken = await this.dao.createToken(user._id);
      
      // Generate reset URL
      const resetUrl = `${baseUrl}/reset-password/${resetToken.token}`;
      
      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken.token,
        resetUrl
      );
      
      if (!emailSent) {
        logger.error(`Failed to send password reset email to ${email}`);
        return {
          success: false,
          message: 'Failed to send password reset email'
        };
      }
      
      logger.info(`Password reset requested for user: ${email}`);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      logger.error(`Error in PasswordResetRepository.requestPasswordReset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate a password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Validation result
   */
  async validateResetToken(token) {
    try {
      // Find valid token
      const tokenDoc = await this.dao.findValidToken(token);
      
      if (!tokenDoc) {
        return {
          valid: false,
          message: 'Invalid or expired password reset token'
        };
      }
      
      return {
        valid: true,
        userId: tokenDoc.user._id.toString(),
        email: tokenDoc.user.email
      };
    } catch (error) {
      logger.error(`Error in PasswordResetRepository.validateResetToken: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Operation result
   */
  async resetPassword(token, newPassword) {
    try {
      // Find valid token
      const tokenDoc = await this.dao.findValidToken(token);
      
      if (!tokenDoc) {
        return {
          success: false,
          message: 'Invalid or expired password reset token'
        };
      }
      
      const userId = tokenDoc.user._id;
      const email = tokenDoc.user.email;
      
      // Check if new password is same as old password
      if (tokenDoc.user.isValidPassword(newPassword)) {
        return {
          success: false,
          message: 'New password cannot be the same as your current password'
        };
      }
      
      // Update password
      const result = await userRepository.updatePassword(userId, newPassword);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }
      
      // Mark token as used
      await this.dao.markTokenAsUsed(token);
      
      // Send confirmation email
      await emailService.sendPasswordResetConfirmation(email);
      
      logger.info(`Password reset successful for user: ${email}`);
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      logger.error(`Error in PasswordResetRepository.resetPassword: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of tokens removed
   */
  async cleanupExpiredTokens() {
    try {
      return await this.dao.cleanupExpiredTokens();
    } catch (error) {
      logger.error(`Error in PasswordResetRepository.cleanupExpiredTokens: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const passwordResetRepository = new PasswordResetRepository();
