import passport from 'passport'
import config from './index.js'
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import { UserModel } from '../models/user.model.js'

// Función personalizada para extraer JWT del header o de las cookies
const cookieExtractor = (req) => {
  let token = null
  if (req && req.cookies) {
    token = req.cookies.token
  }
  return token
}

// Opciones para la estrategia JWT
const jwtOptions = {
  // Intentar extraer el token del header, y si no existe, de las cookies
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor
  ]),
  secretOrKey: config.SECRET,
  algorithms: ['HS256'],
  ignoreExpiration: false, // Make sure we check token expiration
  jsonWebTokenOptions: {
    maxAge: '24h' // Match with token generation expiration
  }
}

// Configurar estrategia JWT
const setupJWTStrategy = () => {
  passport.use(
    'jwt',
    new JWTStrategy(jwtOptions, async (payload, done) => {
      try {
        // Buscar usuario por id en el payload
        const user = await UserModel.findById(payload.id)

        if (!user) {
          return done(null, false, { message: 'User not found' })
        }

        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    })
  )
}

export const initializePassport = () => {
  setupJWTStrategy()
}
