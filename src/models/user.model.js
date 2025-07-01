import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  }
}, { _id: false })

// Determinar si estamos en entorno de prueba
const isTestEnv = process.env.NODE_ENV === 'test'

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: !isTestEnv // Opcional en tests
  },
  birthDate: {
    type: String,
    required: !isTestEnv // Opcional en tests
  },
  activityType: {
    type: String,
    required: !isTestEnv // Opcional en tests
  },
  activityNumber: {
    type: String,
    required: !isTestEnv // Opcional en tests
  },
  phone: {
    type: String,
    required: !isTestEnv // Opcional en tests
  },
  address: {
    type: addressSchema,
    required: false
  },
  favorite: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  role: {
    type: String,
    default: 'guest',
    enum: ['guest', 'user', 'admin']
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
