import mongoose from 'mongoose'

const categoryEnum = [
  'fotovoltaico',
  'bombas',
  'climatizacion',
  'termica',
  'other'
]

const subCategoryEnum = [
  'panel_solar',
  'inversor',
  'baterias',
  'controlador',
  'kit_solar',
  'accesorios',
  'ferreteria',
  'protecciones',
  'estructuras',
  'movilidad',
  'termica',
  'bombeoSolar',
  'calefaccion_solar',
  'otros'
]

const priceInfoSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      min: 0
    },
    iva: {
      type: Number,
      required: true,
      min: 0,
      default: 21
    },
    isOffer: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
      sparse: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    price: priceInfoSchema,
    category: {
      type: String,
      enum: categoryEnum,
      default: 'other'
    },
    subCategory: {
      type: String,
      enum: subCategoryEnum,
      default: 'otros'
    },
    imagePath: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) ? v.length > 0 : typeof v === 'string'
        },
        message: 'At least one image is required'
      }
    },
    active: {
      type: Boolean,
      default: true
    },
    outstanding: {
      type: Boolean,
      default: false
    },
    nameSupplier: {
      type: String
    },
    characteristic: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    model: {
      type: String,
      required: true
    },
    origin: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    warranty: {
      type: String
    },
    system: [String],
    tags: [String],
    information: {
      type: String
    },
    url: {
      type: String
    },
    logo: {
      type: String
    },
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }],
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductQuestion'
    }],
    partner: [String],
    filter: [String],
    productFamily: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Crear índices para mejores búsquedas
productSchema.index({ title: 'text', description: 'text', tags: 'text' })
productSchema.index({ slug: 1 })
productSchema.index({ category: 1 })
productSchema.index({ subCategory: 1 })
productSchema.index({ 'price.isOffer': 1 })

export const ProductModel = mongoose.model('Product', productSchema)
