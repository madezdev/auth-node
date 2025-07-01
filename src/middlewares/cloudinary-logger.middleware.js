import logger from '../config/logger.config.js'

/**
 * Middleware para registrar operaciones de Cloudinary
 */
export const cloudinaryLogger = (req, res, next) => {
  // Guardar el tiempo de inicio para medir la duración de la operación
  const startTime = new Date()

  // Capturar la respuesta original para interceptarla
  const originalSend = res.send

  res.send = function (body) {
    // Calcular duración de la operación
    const duration = new Date() - startTime

    // Obtener información de la solicitud
    const { method, originalUrl, files } = req
    const userId = req.user?._id || 'anonymous'

    // Determinar el tipo de operación con Cloudinary
    const isUploadOperation = files && Object.keys(files).length > 0

    // Contar archivos procesados
    let fileCount = 0
    const fileTypes = []

    if (isUploadOperation && files) {
      // Contar todos los archivos en todas las propiedades
      Object.keys(files).forEach(key => {
        const filesArray = Array.isArray(files[key]) ? files[key] : [files[key]]
        fileCount += filesArray.length

        // Extraer tipos de archivo (para estadísticas)
        filesArray.forEach(file => {
          if (file.mimetype) {
            fileTypes.push(file.mimetype)
          }
        })
      })
    }

    // Determinar si la operación fue exitosa basado en el código de estado HTTP
    const statusCode = res.statusCode
    const successful = statusCode >= 200 && statusCode < 400

    // Crear mensaje de log con la información relevante
    const logMessage = {
      operation: isUploadOperation ? 'cloudinary_upload' : 'cloudinary_operation',
      userId,
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      fileCount: isUploadOperation ? fileCount : undefined,
      fileTypes: isUploadOperation ? [...new Set(fileTypes)] : undefined
    }

    // Registrar el log con el nivel apropiado
    if (successful) {
      logger.info(`Cloudinary: ${JSON.stringify(logMessage)}`)
    } else {
      // Extraer mensaje de error si existe
      const errorMsg = typeof body === 'object' && body.message ? body.message : 'Unknown error'
      logger.error(`Cloudinary error: ${errorMsg} - ${JSON.stringify(logMessage)}`)
    }

    // Continuar con la respuesta original
    return originalSend.call(this, body)
  }

  next()
}

/**
 * Registrar operaciones específicas de Cloudinary (no HTTP)
 * @param {string} operation - Tipo de operación
 * @param {Object} details - Detalles de la operación
 * @param {boolean} success - Indica si la operación fue exitosa
 */
export const logCloudinaryOperation = (operation, details, success = true) => {
  const logLevel = success ? 'info' : 'error'
  const prefix = success ? 'Cloudinary' : 'Cloudinary error'

  logger[logLevel](`${prefix}: ${operation} - ${JSON.stringify(details)}`)
}

export default { cloudinaryLogger, logCloudinaryOperation }
