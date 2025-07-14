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
- Recuperación de contraseña con tokens seguros
- Carrito de compras con gestión de productos
- Finalización de compras para usuarios autenticados

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

3. **Cookies Seguras**:
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
├── src/
│   ├── config/             # Configuración centralizada
│   │   ├── logger.config.js # Configuración del sistema de logging
│   │   └── ...             # Otras configuraciones
│   ├── controllers/        # Controladores
│   ├── middlewares/        # Middlewares personalizados
│   ├── models/             # Modelos de datos
│   ├── routes/             # Definición de rutas
│   ├── server/             # Configuración del servidor
│   └── logs/               # Archivos de logs generados
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore              # Archivos ignorados por git
├── package.json            # Dependencias y scripts
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

### Órdenes

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| POST | /api/orders | Crear una nueva orden | Autenticado |
| GET | /api/orders | Listar todas las órdenes | Admin |
| GET | /api/orders/user | Listar órdenes del usuario actual | Autenticado |
| GET | /api/orders/:id | Detalle de una orden específica | Admin o Propietario |
| PATCH | /api/orders/:id/status | Actualizar estado de una orden | Admin |
| DELETE | /api/orders/:id | Eliminar una orden | Admin |

### Carritos

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| POST | /api/cart | Crear un nuevo carrito | Autenticado |
| GET | /api/cart/:id | Obtener un carrito por ID | Propietario |
| POST | /api/cart/:id/products/:pid | Agregar producto al carrito | Propietario |
| PUT | /api/cart/:id/products/:pid | Actualizar cantidad de producto | Propietario |
| DELETE | /api/cart/:id/products/:pid | Eliminar producto del carrito | Propietario |
| DELETE | /api/cart/:id | Vaciar carrito | Propietario |
| POST | /api/cart/:id/purchase | Procesar compra del carrito | Propietario |

### Preguntas de Productos

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| POST | /api/product-questions | Crear una nueva pregunta | Autenticado |
| GET | /api/product-questions/product/:productId | Listar preguntas de un producto | Público |
| GET | /api/product-questions/user | Listar preguntas del usuario actual | Autenticado |
| GET | /api/product-questions/unanswered | Listar preguntas sin responder | Admin |
| POST | /api/product-questions/:id/answer | Responder una pregunta | Admin |

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

## Sistema de Logging

Se ha implementado un sistema de logging avanzado utilizando Winston para mejorar el monitoreo, depuración y auditoría del sistema de autenticación.

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
   - Controladores de carrito: Operaciones de eCommerce y checkout
   - Middleware de errores: Registro centralizado de errores
   - Configuración del servidor: Eventos de inicio y ciclo de vida

5. **Contexto en los Logs**:
   - Información de usuario: ID, email, roles (cuando está disponible)
   - Metadatos de solicitud: IP, método HTTP, URL
   - Datos técnicos: Stack trace para errores
   - Información de entorno: Identificación de modo test/desarrollo/producción

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
