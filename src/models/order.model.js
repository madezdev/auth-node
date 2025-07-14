import mongoose from 'mongoose'

/**
 * Order schema for tracking user purchases
 * Handles the storage of order information, including products purchased,
 * total amount, order date, buyer information and status
 */
const orderSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  // Reference to the user who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Date when the order was placed
  orderDate: {
    type: Date,
    default: Date.now
  },
  // Total amount of the order
  totalAmount: {
    type: Number,
    required: true
  },
  // Status of the order: pending, processing, canceled, delivered
  status: {
    type: String,
    enum: ['pending', 'processing', 'canceled', 'delivered'],
    default: 'pending'
  },
  // Previous status (for tracking changes)
  previousStatus: {
    type: String,
    enum: ['pending', 'processing', 'canceled', 'delivered', null],
    default: null
  },
  // Store details of ordered products
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
  // Shipping address
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  // Payment information (minimal - could expand based on needs)
  paymentInfo: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'transfer', 'other'],
      default: 'other'
    },
    transactionId: String
  },
  // Notes about the order
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Pre-save hook to track status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.previousStatus = this.status;
  }
  next();
})

export const OrderModel = mongoose.model('Order', orderSchema)
