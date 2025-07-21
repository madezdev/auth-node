import mongoose from 'mongoose'

/**
 * ShippingAddress schema for storing user shipping addresses
 * This schema follows the interface requirements with fields in snake_case
 * to maintain consistency with other models in the database
 */
const shippingAddressSchema = new mongoose.Schema({
  // User who owns this address
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Address fields
  state: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  postal_code: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  apt: {
    type: Number,
    required: false
  },
  locality: {
    type: String,
    required: true,
    trim: true
  },
  // Flag to mark an address as default
  is_default: {
    type: Boolean,
    default: true
  },
  // Additional optional details
  details: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Create a compound index to ensure a user doesn't have duplicate addresses
shippingAddressSchema.index(
  { user: 1, street: 1, postal_code: 1, apt: 1 },
  { unique: true }
)

export const ShippingAddressModel = mongoose.model('ShippingAddress', shippingAddressSchema)
