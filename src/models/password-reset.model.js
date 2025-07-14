import mongoose from 'mongoose'
import crypto from 'crypto'

/**
 * Password Reset schema
 * Handles the storage of password reset tokens with expiration
 */
const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expires: {
    type: Date,
    required: true,
    // Default expiration: 1 hour from now
    default: () => new Date(Date.now() + 3600000)
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

/**
 * Generate a secure random token
 */
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Check if token is expired
 */
passwordResetSchema.methods.isExpired = function() {
  return this.expires < new Date() || this.used
}

/**
 * Mark token as used
 */
passwordResetSchema.methods.markAsUsed = async function() {
  this.used = true
  return this.save()
}

export const PasswordResetModel = mongoose.model('PasswordReset', passwordResetSchema)
