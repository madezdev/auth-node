import mongoose from 'mongoose'

/**
 * Ticket schema for purchase orders
 * Handles the storage of purchase information, including products purchased,
 * amount, purchase date, and buyer information
 */
const ticketSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  purchase_datetime: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  purchaser: {
    type: String,
    required: true
  },
  // Reference to the user who made the purchase
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store details of purchased products
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  // Products that couldn't be purchased due to insufficient stock
  failed_products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number,
    quantity: Number,
    requested_quantity: Number
  }],
  // Whether the purchase was completed fully or partially
  status: {
    type: String,
    enum: ['complete', 'incomplete'],
    default: 'complete'
  }
}, {
  timestamps: true
})

export const TicketModel = mongoose.model('Ticket', ticketSchema)
