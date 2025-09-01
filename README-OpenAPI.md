# API de Gestión de Usuarios - Especificación OpenAPI

## Análisis Paso a Paso del Proyecto

### 1. **Estado Actual del Proyecto**
El proyecto cuenta con:
- **Servicio de autenticación** (`base/auth/`) usando Hono + JWT
- **Servicio de saludo** (`base/saludo/`) con validación JWT 
- **Cliente web** (`base/client/`) que consume ambos servicios
- **Docker Compose** para orquestación de servicios

### 2. **Especificación OpenAPI Desarrollada**

He creado una especificación completa en `openapi-users-spec.yaml` que incluye:

## Operaciones REST Diseñadas

### 🔐 **AUTENTICACIÓN**

#### 1. **POST /auth/register** - Registro de Usuario
- **Método HTTP**: POST
- **Ruta**: `/api/v1/auth/register`
- **Seguridad**: Endpoint público (no requiere autenticación)
- **Parámetros requeridos**:
  - `username` (string, 3-20 chars, pattern: `^[a-zA-Z0-9_]{3,20}$`)
  - `email` (string, format: email, único)
  - `password` (string, min: 8 chars)
  - `firstName` (string, 2-50 chars)
  - `lastName` (string, 2-50 chars)
- **Parámetros opcionales**:
  - `phone` (string, pattern internacional)
- **Respuestas**:
  - **201**: Usuario registrado exitosamente + JWT token
  - **400**: Datos inválidos (validation failed, weak password)
  - **409**: Conflicto (email/username ya existe)

#### 2. **POST /auth/login** - Inicio de Sesión
- **Método HTTP**: POST
- **Ruta**: `/api/v1/auth/login`
- **Seguridad**: Endpoint público
- **Parámetros requeridos**:
  - `identifier` (string, acepta email o username)
  - `password` (string)
- **Respuestas**:
  - **200**: Login exitoso + JWT token + info usuario
  - **400**: Credenciales incompletas
  - **401**: Credenciales incorrectas o cuenta bloqueada

#### 3. **POST /auth/forgot-password** - Recuperación de Contraseña
- **Método HTTP**: POST
- **Ruta**: `/api/v1/auth/forgot-password`
- **Seguridad**: Endpoint público
- **Parámetros requeridos**:
  - `email` (string, format: email)
- **Respuestas**:
  - **200**: Solicitud procesada (siempre por seguridad)
  - **400**: Email inválido
  - **429**: Rate limit excedido

#### 4. **POST /auth/reset-password** - Reset de Contraseña
- **Método HTTP**: POST
- **Ruta**: `/api/v1/auth/reset-password`
- **Seguridad**: Endpoint público (usa token de recuperación)
- **Parámetros requeridos**:
  - `token` (string, token de recuperación)
  - `newPassword` (string, min: 8 chars)
- **Respuestas**:
  - **200**: Contraseña actualizada exitosamente
  - **400**: Token inválido o contraseña débil
  - **410**: Token expirado

### 👥 **GESTIÓN DE USUARIOS (CRUD)**

#### 5. **GET /users** - Listar Usuarios (con Paginación)
- **Método HTTP**: GET
- **Ruta**: `/api/v1/users`
- **Seguridad**: Requiere JWT Bearer token
- **Query Parameters** (todos opcionales):
  - `page` (integer, min: 1, default: 1)
  - `limit` (integer, 1-100, default: 20)
  - `search` (string, busca en nombre/username/email)
  - `status` (enum: active, inactive, suspended)
  - `sortBy` (enum: createdAt, username, email, firstName, lastName)
  - `sortOrder` (enum: asc, desc, default: desc)
- **Respuestas**:
  - **200**: Lista paginada + metadata de paginación
  - **401**: No autenticado
  - **403**: Sin permisos (solo admins ven todos los usuarios)

#### 6. **POST /users** - Crear Usuario (Solo Admins)
- **Método HTTP**: POST
- **Ruta**: `/api/v1/users`
- **Seguridad**: Requiere JWT + rol admin
- **Parámetros**: Mismos que registro + campos adicionales de admin
- **Respuestas**:
  - **201**: Usuario creado exitosamente
  - **400**: Datos inválidos
  - **401**: No autenticado
  - **403**: Sin permisos de admin

#### 7. **GET /users/{userId}** - Obtener Usuario por ID
- **Método HTTP**: GET
- **Ruta**: `/api/v1/users/{userId}`
- **Seguridad**: Requiere JWT (usuarios ven solo su info, admins ven cualquiera)
- **Path Parameters**:
  - `userId` (string, format: uuid, requerido)
- **Respuestas**:
  - **200**: Información del usuario
  - **401**: No autenticado
  - **403**: Sin permisos para ver este usuario
  - **404**: Usuario no encontrado

#### 8. **PUT /users/{userId}** - Actualizar Usuario Completo
- **Método HTTP**: PUT
- **Ruta**: `/api/v1/users/{userId}`
- **Seguridad**: Requiere JWT (propio perfil o admin)
- **Path Parameters**: `userId` (uuid)
- **Body**: Datos completos del usuario (requeridos: firstName, lastName)
- **Respuestas**:
  - **200**: Usuario actualizado exitosamente
  - **400**: Datos inválidos
  - **401**: No autenticado
  - **403**: Sin permisos
  - **404**: Usuario no encontrado

#### 9. **PATCH /users/{userId}** - Actualizar Usuario Parcialmente
- **Método HTTP**: PATCH
- **Ruta**: `/api/v1/users/{userId}`
- **Seguridad**: Requiere JWT (propio perfil o admin)
- **Path Parameters**: `userId` (uuid)
- **Body**: Campos opcionales a actualizar (min 1 campo)
- **Respuestas**:
  - **200**: Usuario actualizado exitosamente
  - **400**: Sin campos para actualizar o datos inválidos
  - **401**: No autenticado
  - **403**: Sin permisos
  - **404**: Usuario no encontrado

#### 10. **DELETE /users/{userId}** - Eliminar Usuario
- **Método HTTP**: DELETE
- **Ruta**: `/api/v1/users/{userId}`
- **Seguridad**: Requiere JWT (propio perfil o admin)
- **Path Parameters**: `userId` (uuid)
- **Respuestas**:
  - **200**: Usuario eliminado exitosamente
  - **401**: No autenticado
  - **403**: Sin permisos o intento de auto-eliminación de admin
  - **404**: Usuario no encontrado

### 👤 **PERFIL DEL USUARIO ACTUAL**

#### 11. **GET /users/me** - Obtener Perfil Actual
- **Método HTTP**: GET
- **Ruta**: `/api/v1/users/me`
- **Seguridad**: Requiere JWT
- **Respuestas**:
  - **200**: Perfil del usuario autenticado
  - **401**: No autenticado

#### 12. **PUT /users/me** - Actualizar Perfil Actual
- **Método HTTP**: PUT
- **Ruta**: `/api/v1/users/me`
- **Seguridad**: Requiere JWT
- **Body**: firstName, lastName (requeridos), phone (opcional)
- **Respuestas**:
  - **200**: Perfil actualizado exitosamente
  - **400**: Datos inválidos
  - **401**: No autenticado

#### 13. **PUT /users/me/password** - Cambiar Contraseña
- **Método HTTP**: PUT
- **Ruta**: `/api/v1/users/me/password`
- **Seguridad**: Requiere JWT
- **Body**:
  - `currentPassword` (string, requerido)
  - `newPassword` (string, min: 8 chars, requerido)
- **Respuestas**:
  - **200**: Contraseña cambiada exitosamente
  - **400**: Nueva contraseña débil o igual a la actual
  - **401**: Contraseña actual incorrecta

## Elementos de Seguridad Implementados

### 1. **Autenticación JWT**
- **Esquema**: Bearer Token
- **Formato**: `Authorization: Bearer <jwt_token>`
- **Algoritmo**: HS256 (configurable)
- **Expiración**: Configurable (default: 1h)

### 2. **Autorización por Roles**
- **user**: Operaciones en su propio perfil
- **admin**: Operaciones en cualquier usuario + gestión completa

### 3. **Validaciones de Seguridad**
- Contraseñas con requisitos mínimos (8 caracteres)
- Rate limiting en recuperación de contraseñas
- Validación de formato de email y teléfono
- Prevención de auto-eliminación de administradores

### 4. **Protección de Endpoints**
- Endpoints públicos: registro, login, recuperación/reset contraseña
- Endpoints protegidos: Todas las operaciones CRUD y perfil
- Endpoints de admin: Crear usuarios, listar todos los usuarios

## Esquemas de Datos Definidos

### **UserResponse** (Respuesta de Usuario)
```yaml
id: uuid
username: string (único)
email: string (único, format email)
firstName: string
lastName: string
phone: string (opcional, format internacional)
status: enum [active, inactive, suspended]
role: enum [user, admin]
createdAt: datetime
updatedAt: datetime
lastLoginAt: datetime (opcional)
```

### **PaginationInfo** (Información de Paginación)
```yaml
page: integer (página actual)
limit: integer (elementos por página)
total: integer (total de elementos)
totalPages: integer (total de páginas)
hasNext: boolean
hasPrev: boolean
```

### **Error** (Esquema de Error Estándar)
```yaml
error: string (tipo de error)
message: string (descripción detallada)
code: string (código específico)
details: object (información adicional)
```

## Códigos de Respuesta HTTP

### **Exitosos (2xx)**
- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente

### **Errores del Cliente (4xx)**
- **400**: Bad Request - Datos inválidos o mal formato
- **401**: Unauthorized - No autenticado o token inválido
- **403**: Forbidden - Autenticado pero sin permisos
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Recurso ya existe (email/username duplicado)
- **410**: Gone - Recurso expirado (token de recuperación)
- **429**: Too Many Requests - Rate limit excedido

### **Errores del Servidor (5xx)**
- **500**: Internal Server Error - Error interno del servidor

## Próximos Pasos para Implementación

### **Reto 2**: Base de Datos
1. Diseñar esquema de BD para usuarios con campos definidos
2. Configurar PostgreSQL/MongoDB con Docker Compose
3. Crear modelos y conexión a BD

### **Reto 3**: Implementación API
1. Desarrollar endpoints según especificación OpenAPI
2. Implementar middleware de autenticación/autorización
3. Añadir validaciones y manejo de errores
4. Implementar sistema de recuperación de contraseñas

### **Reto 4**: Paginación
1. Implementar sistema de paginación eficiente
2. Añadir filtros y ordenamiento
3. Optimizar queries de BD

### **Reto 5**: Interfaz Swagger
1. Configurar Swagger UI para la especificación
2. Desplegar interfaz web para testing
3. Documentar ejemplos y casos de uso

## Uso de la Especificación

### **Generar Documentación**
```bash
# Con Swagger UI
npx swagger-ui-serve openapi-users-spec.yaml

# Con Redoc
npx redoc-cli serve openapi-users-spec.yaml
```

### **Validar Especificación**
```bash
# Con swagger-tools
npx swagger-tools validate openapi-users-spec.yaml

# Con openapi-lint
npx openapi-lint openapi-users-spec.yaml
```

### **Generar Código Cliente**
```bash
# Generar cliente JavaScript
npx @openapitools/openapi-generator-cli generate \
  -i openapi-users-spec.yaml \
  -g javascript \
  -o ./client-sdk

# Generar cliente Python
npx @openapitools/openapi-generator-cli generate \
  -i openapi-users-spec.yaml \
  -g python \
  -o ./python-client
```

Esta especificación OpenAPI proporciona una base sólida y completa para implementar el sistema de gestión de usuarios con todas las operaciones CRUD, autenticación segura, y recuperación de contraseñas según los requisitos del proyecto.
