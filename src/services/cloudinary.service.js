import cloudinary from '../config/cloudinary.config.js'
import fs from 'fs'
import { logCloudinaryOperation } from '../middlewares/cloudinary-logger.middleware.js'

class CloudinaryService {
  /**
   * Sube un archivo a Cloudinary
   * @param {string} filePath - Ruta del archivo local
   * @param {string} folder - Carpeta en Cloudinary donde guardar el archivo
   * @param {string} resourceType - Tipo de recurso ('image', 'video', 'raw', 'auto')
   * @returns {Promise<object>} - Objeto con los datos del archivo en Cloudinary
   */
  async uploadFile (filePath, folder, resourceType = 'auto') {
    try {
      // Registrar inicio de la operación
      logCloudinaryOperation('upload_start', { filePath, folder, resourceType })

      // Subir el archivo a Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: resourceType
      })

      // Eliminar el archivo temporal después de subirlo
      fs.unlinkSync(filePath)

      // Registrar operación exitosa
      logCloudinaryOperation('upload_success', {
        publicId: result.public_id,
        resourceType,
        size: result.bytes,
        format: result.format
      })

      return result
    } catch (error) {
      // Registrar error
      logCloudinaryOperation('upload_error', {
        filePath,
        resourceType,
        error: error.message
      }, false)

      // Asegurarse de eliminar el archivo temporal si hay un error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      throw error
    }
  }

  /**
   * Elimina un archivo de Cloudinary
   * @param {string} publicId - ID público del recurso en Cloudinary
   * @param {string} resourceType - Tipo de recurso ('image', 'video', 'raw', 'auto')
   * @returns {Promise<object>} - Resultado de la eliminación
   */
  async deleteFile (publicId, resourceType = 'image') {
    try {
      // Registrar inicio de la operación de eliminación
      logCloudinaryOperation('delete_start', { publicId, resourceType })

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      })

      // Registrar operación exitosa
      logCloudinaryOperation('delete_success', {
        publicId,
        resourceType,
        result
      })

      return result
    } catch (error) {
      // Registrar error de eliminación
      logCloudinaryOperation('delete_error', {
        publicId,
        resourceType,
        error: error.message
      }, false)

      throw error
    }
  }

  /**
   * Formatea los datos del resultado de Cloudinary para guardar en MongoDB
   * @param {object} cloudinaryResult - Resultado de la carga a Cloudinary
   * @returns {object} - Objeto formateado para MongoDB
   */
  formatCloudinaryResult (cloudinaryResult) {
    return {
      public_id: cloudinaryResult.public_id,
      url: cloudinaryResult.url,
      secure_url: cloudinaryResult.secure_url,
      format: cloudinaryResult.format,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      resource_type: cloudinaryResult.resource_type,
      created_at: new Date()
    }
  }
}

export default new CloudinaryService()
