import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../config/logger.config.js';

/**
 * Service for sending emails
 */
export class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.MAIL_SERVICE,
      auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
      }
    });
  }

  /**
   * Send password reset email
   * @param {String} email - Recipient email
   * @param {String} resetLink - Password reset link
   * @returns {Promise} - Result of send operation
   */
  async sendPasswordResetEmail(email, resetLink) {
    try {
      const mailOptions = {
        from: `"E-Commerce App" <${config.MAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
            </div>
            <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Thank you,</p>
            <p>The E-Commerce Team</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending password reset email: ${error.message}`, { stack: error.stack });
      return false;
    }
  }
}
