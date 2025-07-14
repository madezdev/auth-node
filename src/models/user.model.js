import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

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
  age: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  previousPasswords: {
    type: [String],
    default: []
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  role: {
    type: String,
    default: 'guest',
    enum: ['guest', 'user', 'admin']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  lastLoginAttempt: Date,
  lastLoginIp: String
}, {
  timestamps: true
})

// Pre-guardado hook para hashear la contraseña antes de guardar
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  // Aumentamos la seguridad del hash
  const saltRounds = 12 // Incrementamos el costo del hashing
  this.password = bcrypt.hashSync(this.password, saltRounds)
  next()
})

// Método para comparar contraseña
userSchema.methods.isValidPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

export const UserModel = mongoose.model('User', userSchema)
