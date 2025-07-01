import mongoose from 'mongoose'

const cloudinaryAssetSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    secure_url: {
      type: String,
      required: true
    },
    format: {
      type: String
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    resource_type: {
      type: String,
      enum: ['image', 'video', 'raw', 'auto'],
      default: 'image'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

// Using Map for dynamic key-value pairs
const characteristicsSchema = new mongoose.Schema(
  {
    // This allows for any key-value pair to be stored
    // Keys will be strings and values will be stored as mixed types
    // This provides maximum flexibility for different product types
    properties: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  }
)

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    information: {
      type: String,
      required: true
    },
    product_code: {
      type: String,
      required: true,
      unique: true
    },
    supplier: {
      type: String,
      required: true
    },
    characteristics: {
      type: characteristicsSchema,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    warranty: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    origin: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    iva: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discount: {
      type: Boolean,
      required: true,
      default: false
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    category: {
      type: String,
      required: true
    },
    subcategory: {
      type: String,
      required: true
    },
    system: {
      type: [String],
      required: true
    },
    partner: {
      type: [String],
      required: true
    },
    family: {
      type: [String],
      required: true
    },
    tags: {
      type: [String],
      required: true
    },
    url: {
      type: String,
      required: false
    },
    // Colección de imágenes asociadas al producto
    images: {
      type: [cloudinaryAssetSchema],
      default: []
    },
    // Imagen principal (para mantener compatibilidad)
    main_image: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },
    // Archivos asociados al producto (documentos, manuales, etc.)
    files: {
      type: [cloudinaryAssetSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
)

export const ProductModel = mongoose.model('Product', productSchema)
