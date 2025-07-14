import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  // Campos requeridos por la interfaz de NextJS
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  identifier: {
    type: Number,
    required: true
  },
  tax_identifier: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Por favor ingrese un email válido']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },

  // Campos adicionales necesarios para el sistema
  password: {
    type: String,
    required: true
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  role: {
    type: String,
    default: 'user',
    enum: ['guest', 'user', 'admin']
  },
  active: {
    type: Boolean,
    default: true
  },
  last_connection: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Pre-guardado hook para hashear la contraseña antes de guardar
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  const saltRounds = 10
  this.password = bcrypt.hashSync(this.password, saltRounds)
  next()
})

// Método para comparar contraseña
userSchema.methods.isValidPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

export const UserModel = mongoose.model('User', userSchema)
