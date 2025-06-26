import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false })

const cartSchema = new mongoose.Schema({
  products: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true
})

export const CartModel = mongoose.model('Cart', cartSchema)
