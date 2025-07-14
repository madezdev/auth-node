import nodemailer from 'nodemailer'
import config from '../config/index.js'
import logger from '../config/logger.config.js'

/**
 * Email Service
 * Provides functionality for sending emails such as password recovery
 */
class EmailService {
  constructor () {
    this.transporter = nodemailer.createTransport({
      service: config.EMAIL_SERVICE,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      }
    })
    logger.debug('EmailService initialized')
  }
  
  /**
   * Send a password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - URL for password reset
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail (email, resetToken, resetUrl) {
    try {
      const mailOptions = {
        from: `"E-commerce Support" <${config.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset. Please click on the button below to reset your password:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                     text-align: center; text-decoration: none; display: inline-block;
                     font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you!</p>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      logger.info(`Password reset email sent to ${email}: ${info.messageId}`)
      return true
    } catch (error) {
      logger.error(`Error sending password reset email to ${email}: ${error.message}`, { stack: error.stack })
      return false
    }
  }
  
  /**
   * Send a confirmation email after password reset
   * @param {string} email - Recipient email
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetConfirmation (email) {
    try {
      const mailOptions = {
        from: `"E-commerce Support" <${config.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Successful',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact our support team immediately.</p>
          <p>Thank you!</p>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      logger.info(`Password reset confirmation email sent to ${email}: ${info.messageId}`)
      return true
    } catch (error) {
      logger.error(`Error sending password reset confirmation email to ${email}: ${error.message}`, { stack: error.stack })
      return false
    }
  }

  /**
   * Send purchase confirmation email
   * @param {string} email - Recipient email
   * @param {Object} ticket - Purchase ticket
   * @returns {Promise<boolean>} Success status
   */
  async sendPurchaseConfirmation (email, ticket) {
    try {
      // Generate HTML for products
      let productsHTML = ''
      let failedProductsHTML = ''

      // Process purchased products
      if (ticket.products && ticket.products.length > 0) {
        productsHTML = `
          <h3>Purchased Items:</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
            ${ticket.products.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        `
      }
      
      // Process failed products if any
      if (ticket.failed_products && ticket.failed_products.length > 0) {
        failedProductsHTML = `
          <h3>Items Not Available (Insufficient Stock):</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <th>Product</th>
              <th>Requested</th>
              <th>Available</th>
              <th>Price</th>
            </tr>
            ${ticket.failed_products.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.requested_quantity}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        `
      }
      
      const mailOptions = {
        from: `"E-commerce Support" <${config.EMAIL_USER}>`,
        to: email,
        subject: `Order Confirmation #${ticket.code}`,
        html: `
          <h1>Thank You for Your Purchase!</h1>
          <p>Order #: <strong>${ticket.code}</strong></p>
          <p>Date: ${new Date(ticket.purchase_datetime).toLocaleString()}</p>
          <p>Status: <strong>${ticket.status === 'complete' ? 'Complete' : 'Incomplete (Some items unavailable)'}</strong></p>
          
          ${productsHTML}
          
          ${failedProductsHTML}
          
          <h3>Order Summary:</h3>
          <p>Total: <strong>$${ticket.amount.toFixed(2)}</strong></p>

          <p>Thank you for shopping with us!</p>
        `
      }

      const info = await this.transporter.sendMail(mailOptions)
      logger.info(`Purchase confirmation email sent to ${email}: ${info.messageId}`)
      return true
    } catch (error) {
      logger.error(`Error sending purchase confirmation email to ${email}: ${error.message}`, { stack: error.stack })
      return false
    }
  }

  /**
   * Send order status update email
   * @param {string} email - Recipient email
   * @param {Object} order - Order object with updated status
   * @returns {Promise<boolean>} Success status
   */
  async sendOrderStatusUpdate(email, order) {
    try {
      // Get status-specific content
      let statusMessage = '';
      let statusColor = '';
      
      switch (order.status) {
        case 'pending':
          statusMessage = 'Your order has been received and is pending processing.';
          statusColor = '#FFA500'; // Orange
          break;
        case 'processing':
          statusMessage = 'Good news! Your order is now being processed and prepared for shipping.';
          statusColor = '#1E90FF'; // Blue
          break;
        case 'delivered':
          statusMessage = 'Great news! Your order has been delivered. We hope you enjoy your purchase!';
          statusColor = '#32CD32'; // Green
          break;
        case 'canceled':
          statusMessage = 'Your order has been canceled. If you did not request this cancellation, please contact our support team.';
          statusColor = '#DC143C'; // Red
          break;
        default:
          statusMessage = `Your order status has been updated to: ${order.status}`;
          statusColor = '#808080'; // Gray
      }
      
      // Generate HTML for products
      const productsHTML = order.products && order.products.length > 0
        ? `
          <h3>Order Items:</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
            ${order.products.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        `
        : '';
      
      const mailOptions = {
        from: `"E-commerce Support" <${config.EMAIL_USER}>`,
        to: email,
        subject: `Order Status Update: #${order.code} - ${order.status.toUpperCase()}`,
        html: `
          <h1>Order Status Update</h1>
          <p>Order #: <strong>${order.code}</strong></p>
          <p>Status: <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${order.status}</span></p>
          <p>${statusMessage}</p>
          
          ${productsHTML}
          
          <h3>Order Summary:</h3>
          <p>Total: <strong>$${order.totalAmount.toFixed(2)}</strong></p>

          ${order.status === 'delivered' ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <h3>We'd love your feedback!</h3>
              <p>Please let us know how we did by rating your purchase experience.</p>
            </div>
          ` : ''}

          <p>Thank you for shopping with us!</p>
          <p>If you have any questions about your order, please contact our customer service.</p>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Order status update email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending order status update email to ${email}: ${error.message}`, { stack: error.stack });
      return false;
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService()
