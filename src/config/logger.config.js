import winston from 'winston'

// Configuración de niveles y colores personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'magenta'
  }
}

// Aplicar colores personalizados
winston.addColors(customLevels.colors)

// Crear formato personalizado
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`
  })
)

// Formato para consola (con colores)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  logFormat
)

// Determinar el nivel de log según el entorno
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development'
  switch (env) {
    case 'production':
      return 'info' // En producción, solo logs de info y superiores
    case 'test':
      return process.env.LOG_LEVEL_TEST || 'warn' // En test, solo warnings y errores por defecto
    default:
      return 'debug' // En desarrollo, todos los logs
  }
}

// Crear logger con las configuraciones
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: getLogLevel(),
  transports: [
    // Log a consola siempre
    new winston.transports.Console({
      format: consoleFormat
    }),

    // Log de errores a archivo (no en test)
    ...(process.env.NODE_ENV !== 'test'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat
          }),
          // Log de todas las categorías a archivo
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat
          })
        ]
      : [])
  ]
})

export default logger
