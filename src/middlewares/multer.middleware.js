import multer from 'multer'
import path from 'path'

// Configuración del almacenamiento temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'tmp/uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Filtro para validar tipos de archivos
const fileFilter = (req, file, cb) => {
  // Validación para imágenes
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true)
    } else {
      return cb(new Error('Solo se permiten archivos de imagen'), false)
    }
  }
  
  // Validación para documentos/archivos
  if (file.fieldname === 'files') {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (allowedMimes.includes(file.mimetype)) {
      return cb(null, true)
    } else {
      return cb(new Error('Formato de archivo no soportado'), false)
    }
  }
  
  cb(null, true)
}

// Configuración de Multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: fileFilter
})

// Middleware para manejar múltiples campos de archivos
export const productFileUpload = upload.fields([
  { name: 'images', maxCount: 5 },  // Máximo 5 imágenes por producto
  { name: 'files', maxCount: 3 }    // Máximo 3 archivos por producto
])
