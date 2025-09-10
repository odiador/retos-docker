import { z } from 'zod'

// Esquemas de error compartidos
export const errorResponse = z.object({
  error: z.string().describe('Mensaje descriptivo del error')
}).describe('Respuesta de error genérica')

export const validationErrorResponse = z.object({
  error: z.string().describe('Mensaje descriptivo del error de validación'),
  details: z.array(z.object({
    field: z.string().describe('Campo que causó el error'),
    message: z.string().describe('Mensaje específico del error de validación'),
    code: z.string().optional().describe('Código del error de validación')
  })).describe('Detalles específicos de validación')
}).describe('Respuesta de error de validación con detalles estructurados')

// Esquemas de respuesta de éxito
export const successResponse = z.object({
  message: z.string().describe('Mensaje de confirmación de éxito')
}).describe('Respuesta de éxito genérica')

// Esquema de usuario base (compartido)
export const baseUserSchema = z.object({
  id: z.string().describe('ID único del usuario'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(20, 'El nombre de usuario no puede tener más de 20 caracteres').describe('Nombre de usuario único'),
  email: z.string().email('Formato de email inválido').describe('Correo electrónico del usuario'),
  firstName: z.string().nullable().optional().describe('Nombre del usuario'),
  lastName: z.string().nullable().optional().describe('Apellido del usuario'),
  phone: z.string().nullable().optional().describe('Número de teléfono'),
  role: z.string().describe('Rol del usuario en el sistema'),
  status: z.string().describe('Estado de la cuenta del usuario'),
  createdAt: z.string().optional().describe('Fecha de creación de la cuenta'),
  updatedAt: z.string().nullable().optional().describe('Fecha de última actualización'),
  lastLoginAt: z.string().nullable().optional().describe('Fecha del último inicio de sesión'),
})

// Esquema de usuario para respuestas (sin campos sensibles)
export const userSchema = baseUserSchema.describe('Información completa del usuario')

// Esquemas de paginación
export const paginationQuery = z.object({
  page: z.string().regex(/^\d+$/, 'El número de página debe ser un entero positivo').optional().describe('Número de página (empieza en 1)'),
  limit: z.string().regex(/^\d+$/, 'El límite debe ser un entero positivo').optional().describe('Número de elementos por página (máximo 100)'),
})


export const paginationResponse = z.object({
  items: z.array(z.any()).describe('Lista de elementos'),
  total: z.number().describe('Total de elementos encontrados'),
  page: z.number().describe('Página actual'),
  limit: z.number().describe('Límite de elementos por página'),
})

// Esquemas de parámetros de ruta
export const usernameParam = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(20, 'El nombre de usuario no puede tener más de 20 caracteres').describe('Nombre de usuario del usuario objetivo')
}).describe('Parámetros de ruta para endpoints que requieren username')
