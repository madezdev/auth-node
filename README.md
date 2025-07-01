# Node.js Authentication API

Un sistema de autenticación seguro con Node.js, Express y JWT.

## Características Principales

- Registro y autenticación de usuarios
- Autenticación JWT (JSON Web Tokens)
- Protección de rutas basada en roles
- Cookies seguras HTTP-only
- Implementación de seguridad en API RESTful
- Integración con MongoDB mediante Mongoose
- Validación de datos de entrada
- Gestión de permisos y roles de usuario
- Sistema de logging avanzado con Winston
- Integración con Cloudinary para manejo de imágenes y archivos
- Soporte para múltiples imágenes y archivos por producto

## Requisitos

- Node.js 14+
- MongoDB 4+
- NPM o Yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd auth-node
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo de variables de entorno:
```bash
cp .env.example .env
```

4. Completar las variables de entorno en el archivo `.env`:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=<tu-uri-de-mongodb>
SECRET=<tu-clave-secreta-para-jwt>
CLIENT_URL=http://localhost:3000

# Cloudinary config
CLOUDINARY_CLOUD_NAME=<tu-cloud-name>
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
```

5. Iniciar el servidor:
```bash
npm start
```

## Medidas de Seguridad Implementadas

### Autenticación de Usuario

1. **Hash de Contraseñas**: 
   - Implementación de bcrypt con factor de costo 10
   - Protección contra ataques de fuerza bruta y tablas rainbow

2. **JSON Web Tokens (JWT)**:
   - Tokens firmados con algoritmo HS256
   - Tiempo de expiración configurado a 24 horas
   - Validación estricta de algoritmos y expiración
   
3. **Sistema de Roles**:
   - `guest`: Rol por defecto para usuarios recién registrados con información incompleta
   - `user`: Asignado automáticamente cuando el usuario completa toda su información personal y dirección
   - `admin`: Rol con privilegios elevados para administración
   - Promoción automática de `guest` a `user` al completar perfil

4. **Cookies Seguras**:
   - HTTP-only para prevenir acceso desde JavaScript
   - Secure flag en entornos de producción
   - SameSite strict para prevenir CSRF

### Protección de Endpoints

1. **Limitación de Tasa (Rate Limiting)**:
   - Límites estrictos para rutas de autenticación (5 intentos cada 15 min)
   - Límites más permisivos para rutas de API general (100 solicitudes cada 15 min)
   - Prevención de ataques de fuerza bruta y DDoS

2. **Validación de Datos**:
   - Validación estricta de emails con expresiones regulares
   - Requisitos de contraseña segura (longitud mínima, caracteres especiales, etc.)
   - Sanitización de datos de entrada

3. **Control de Acceso**:
   - Middleware de autenticación basado en JWT
   - Sistema de roles (user/admin)
   - Middleware de autorización para verificar roles

### Protección General

1. **Headers de Seguridad (Helmet)**:
   - Configuración personalizada de políticas de seguridad de contenido
   - Protection contra XSS, clickjacking, MIME sniffing
   - Directivas de seguidad configuradas en security.config.js

2. **CORS Configurado**:
   - Restricción de origen
   - Métodos permitidos limitados a necesarios
   - Manejo de credenciales para autenticación

3. **Manejo de Errores**:
   - Centralizado para evitar fugas de información
   - Ocultamiento de detalles técnicos en producción
   - Formateo consistente de mensajes de error
   - Logging detallado para diagnóstico y auditoría

4. **Limitación de Payload**:
   - Restricción de tamaño de cuerpo JSON a 10kb
   - Prevención de ataques DoS basados en payload

## Estructura de Directorios

```
auth-node/
│── src/
│   │── config/             # Configuración centralizada
│   │   │── logger.config.js # Configuración del sistema de logging
│   │   │── cloudinary.config.js # Configuración de Cloudinary
│   │   └── ...             # Otras configuraciones
│   │── controllers/        # Controladores
│   │── middlewares/        # Middlewares personalizados
│   │   │── multer.middleware.js # Middleware para carga de archivos
│   │   └── cloudinary-logger.middleware.js # Logging para Cloudinary
│   │── models/             # Modelos de datos
│   │── routes/             # Definición de rutas
│   │── services/           # Servicios externos
│   │   └── cloudinary.service.js # Servicio para Cloudinary
│   │── server/             # Configuración del servidor
│   └── logs/               # Archivos de logs generados
│── uploads/                # Directorio temporal para uploads (autogenerado)
│── .env.example            # Ejemplo de variables de entorno
│── .gitignore              # Archivos ignorados por git
│── package.json            # Dependencias y scripts
└── README.md               # Documentación del proyecto
```

## Endpoints API

### Autenticación

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| POST | /api/sessions/register | Registro de nuevo usuario | Público |
| POST | /api/sessions/login | Inicio de sesión | Público |
| GET | /api/sessions/current | Obtener usuario actual | Autenticado |
| GET | /api/sessions/logout | Cerrar sesión | Público |
| POST | /api/sessions/admin | Crear usuario admin | Admin |

### Usuarios

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| GET | /api/users | Listar usuarios | Admin |
| GET | /api/users/:id | Detalle de usuario | Admin o Propietario |
| PUT | /api/users/:id | Actualizar usuario | Admin o Propietario |

### Productos

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| GET | /api/products | Listar productos | Público |
| GET | /api/products/:id | Detalle de producto | Público |
| POST | /api/products | Crear producto con imágenes/archivos | Admin |
| PUT | /api/products/:id | Actualizar producto con imágenes/archivos | Admin |
| DELETE | /api/products/:id | Eliminar producto | Admin |

## Recomendaciones de Seguridad Adicionales

1. **En producción**:
   - Utilizar HTTPS siempre
   - Configurar el flag `secure` en cookies
   - Limitar CORS a dominio(s) específico(s)

2. **Claves y secretos**:
   - Nunca compartir claves secretas en repositorios
   - Rotar claves JWT regularmente
   - Utilizar variables de entorno para secretos

3. **Monitoreo y logs**:
   - Sistema de logging con Winston implementado
   - Registro detallado de actividad de autenticación y autorización
   - Monitoreo de intentos fallidos con información contextual
   - Logs diferenciados por nivel de severidad
   - Configuración adaptada según entorno (desarrollo/prueba/producción)

## Integración con Cloudinary

Se ha implementado una robusta integración con Cloudinary para gestionar la carga y almacenamiento de imágenes y archivos asociados a los productos.

### Características Principales

1. **Soporte para Múltiples Archivos**:
   - Hasta 5 imágenes por producto
   - Hasta 3 archivos complementarios por producto (PDF, documentos, etc.)
   - Imagen principal destacada para compatibilidad con versiones anteriores

2. **Middleware de Carga de Archivos**:
   - Implementación con Multer para manejo de `multipart/form-data`
   - Validación de tipos MIME para prevenir uploads maliciosos
   - Almacenamiento temporal en disco antes de subida a la nube
   - Límites de tamaño y cantidad de archivos configurables

3. **Servicio Cloudinary**:
   - Subida optimizada de imágenes y archivos
   - Eliminación automática de archivos temporales
   - Gestión de errores robusta para cada archivo
   - Organización en carpetas según tipo de recurso

4. **Modelo de Datos Mejorado**:
   - Esquema para almacenar metadatos completos de cada recurso
   - Soporte para URLs, dimensiones, formatos y otros metadatos
   - Referencias a los recursos almacenados en Cloudinary

5. **Logging Especializado**:
   - Registro detallado de operaciones con Cloudinary
   - Trazabilidad completa de subidas y eliminaciones
   - Monitoreo de rendimiento y tiempo de respuesta

### Flujo de Trabajo

1. El cliente envía un formulario con imágenes/archivos usando `multipart/form-data`
2. El middleware `multer` procesa y valida los archivos, almacenándolos temporalmente
3. El controlador recibe los archivos procesados en `req.files`
4. El servicio de Cloudinary sube cada archivo y obtiene los metadatos
5. El modelo de producto almacena las referencias y metadatos de cada recurso
6. Los archivos temporales son eliminados automáticamente

### Implementación Técnica

- **Modelo**: Schema de Mongoose ampliado con arrays `images` y `files`
- **Controladores**: Métodos `createProduct` y `updateProduct` adaptados para manejo de archivos
- **Rutas**: Endpoints protegidos con middleware de autenticación, autorización y upload
- **Variables de Entorno**: Configuración segura de credenciales de Cloudinary

## Sistema de Logging

Se ha implementado un sistema de logging avanzado utilizando Winston para mejorar el monitoreo, depuración y auditoría del sistema completo, incluyendo autenticación y operaciones con Cloudinary.

### Características del Sistema de Logging

1. **Configuración por Entorno**:
   - Desarrollo: Logs detallados con información completa
   - Pruebas: Logging adaptado para entornos de testing con información simulada
   - Producción: Optimizado para rendimiento con registros de eventos críticos

2. **Niveles de Logging Implementados**:
   - `error`: Errores críticos que requieren atención inmediata
   - `warn`: Advertencias sobre comportamientos potencialmente problemáticos
   - `info`: Información general sobre el funcionamiento normal del sistema
   - `debug`: Información detallada para diagnóstico (solo en desarrollo)

3. **Transporte de Logs**:
   - Consola: Salida formateada con colores para desarrollo
   - Archivos: Registro persistente en archivos separados por nivel
   - Rotación: Configuración para mantener histórico y administrar espacio

4. **Componentes con Logging Implementado**:
   - Middleware de autenticación: Verificación de tokens, bypass de tests
   - Middleware de autorización: Comprobación de roles y permisos
   - Controladores de autenticación: Login, registro, logout
   - Controladores de usuarios: Operaciones CRUD con trazabilidad
   - Controladores de productos: Operaciones con imágenes y archivos
   - Servicio de Cloudinary: Subida y eliminación de recursos
   - Middleware de Cloudinary: Logging especializado de operaciones
   - Middleware de errores: Registro centralizado de errores
   - Configuración del servidor: Eventos de inicio y ciclo de vida

5. **Contexto en los Logs**:
   - Información de usuario: ID, email, roles (cuando está disponible)
   - Metadatos de solicitud: IP, método HTTP, URL
   - Datos técnicos: Stack trace para errores
   - Información de entorno: Identificación de modo test/desarrollo/producción
   - Operaciones Cloudinary: Tipo de operación, archivos procesados, duración
   - Estadísticas de archivos: Tipos, cantidades, tamaños y formatos

### Beneficios

- **Trazabilidad**: Seguimiento completo del flujo de autenticación y autorización
- **Seguridad**: Registro de eventos relacionados con accesos y permisos
- **Depuración**: Información contextual para resolución rápida de problemas
- **Auditoría**: Registro de cambios en datos sensibles de usuarios
- **Optimización**: Adaptación del nivel de detalle según el entorno

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo LICENSE para más detalles.

## Contacto

Para consultas o sugerencias, contactar a [madezdev@gmail.com].
