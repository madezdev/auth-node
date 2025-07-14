import winston from 'winston'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  return env === 'development' ? 'debug' : 'info'
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
}

// Add colors to winston
winston.addColors(colors)

// Define the format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} [${info.level}]: ${info.message}`
  )
)

// Define the format for file output (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    info => `${info.timestamp} [${info.level}]: ${info.message}`
  )
)

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    // Console transport for all logs
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat
    }),
    // File transport for error logs only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat
    })
  ]
})

export default logger
