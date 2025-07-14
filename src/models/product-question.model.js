import mongoose from 'mongoose'

/**
 * Schema for product questions and answers
 * Allows users to ask questions about products and admins to respond
 */
const productQuestionSchema = new mongoose.Schema({
  // Reference to the product being questioned
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // User who asked the question
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Question content
  question: {
    type: String,
    required: true,
    trim: true
  },
  // Admin's answer
  answer: {
    type: String,
    trim: true,
    default: null
  },
  // Admin who answered the question
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Whether the question has been answered
  isAnswered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

export const ProductQuestionModel = mongoose.model('ProductQuestion', productQuestionSchema)
