// Interfaz para request autenticado
interface AuthenticatedRequest extends Request {
  user?: UserPayload
}

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Client } from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretsupersecretsupersecret';

dotenv.config()

// Configuración de conexión a PostgreSQL
const db = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
})
db.connect().then(() => {
  console.log('Conectado a PostgreSQL')
}).catch((err: any) => {
  console.error('Error de conexión a PostgreSQL:', err)
})

// Establecer el search_path para la conexión
db.query("SET search_path TO auth;").catch((err) => {
  console.error('Error al establecer search_path:', err)
})

const app = new Hono()

// Middleware para proteger rutas
type UserPayload = {
  id: string
  role: string
  username: string
}

const authMiddleware = async (c: any, next: any) => {
  const auth = c.req.header('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'No autenticado', message: 'Token requerido' }, 401)
  }
  try {
    const token = auth.replace('Bearer ', '')
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload
    // Guardar el usuario en el request
    c.req.user = payload
    await next()
  } catch (err) {
    return c.json({ error: 'No autenticado', message: 'Token inválido' }, 401)
  }
}

// ========== AUTENTICACIÓN ==========
// Registro de usuario
app.post('/auth/register', async (c) => {
  const body = await c.req.json()
  const { username, email, password, firstName, lastName, phone } = body
  if (!username || !email || !password || !firstName || !lastName) {
    return c.json({ error: 'Validation failed', message: 'Campos requeridos faltantes' }, 400)
  }
  // Verificar si el usuario ya existe
  const exists = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username])
  if (exists.rows.length > 0) {
    return c.json({ error: 'Conflict', message: 'Usuario o email ya existe' }, 409)
  }
  const hash = await bcrypt.hash(password, 10)
  const result = await db.query(
    'INSERT INTO users (username, email, password, first_name, last_name, phone, status, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [username, email, hash, firstName, lastName, phone || null, 'active', 'user']
  )
  return c.json({ message: 'Usuario registrado exitosamente', id: result.rows[0].id }, 201)
})

// Login de usuario
app.post('/auth/login', async (c) => {
  const body = await c.req.json()
  const { identifier, password } = body
  if (!identifier || !password) {
    return c.json({ error: 'Validation failed', message: 'Credenciales incompletas' }, 400)
  }
  const userRes = await db.query('SELECT * FROM users WHERE email = $1 OR username = $1', [identifier])
  const user = userRes.rows[0]
  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'Usuario o contraseña incorrectos' }, 401)
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return c.json({ error: 'Unauthorized', message: 'Usuario o contraseña incorrectos' }, 401)
  }
  const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1h' })
  return c.json({ access_token: token })
})

// Recuperar contraseña (simulado, solo genera token)
app.post('/auth/forgot-password', async (c) => {
  const body = await c.req.json()
  const { email } = body
  if (!email) {
    return c.json({ error: 'Validation failed', message: 'Email requerido' }, 400)
  }
  const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email])
  if (userRes.rows.length === 0) {
    // Por seguridad, siempre responde 200
    return c.json({ message: 'Si el email existe, se enviará recuperación' })
  }
  // Generar token de recuperación (simulado)
  const recoveryToken = jwt.sign({ id: userRes.rows[0].id, type: 'recovery' }, JWT_SECRET, { expiresIn: '15m' })
  // Aquí deberías enviar el email con el token
  return c.json({ message: 'Instrucciones enviadas', recoveryToken })
})

// Resetear contraseña
app.post('/auth/reset-password', async (c) => {
  const body = await c.req.json()
  const { token, newPassword } = body
  if (!token || !newPassword) {
    return c.json({ error: 'Validation failed', message: 'Token y nueva contraseña requeridos' }, 400)
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.type !== 'recovery') throw new Error('Token inválido')
    const hash = await bcrypt.hash(newPassword, 10)
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, payload.id])
    return c.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (err) {
    return c.json({ error: 'Invalid token', message: 'Token inválido o expirado' }, 400)
  }
})

// ========== GESTIÓN DE USUARIOS (CRUD) ==========
// Listar usuarios (solo admin, con paginación y filtros)
app.get('/users', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  if (user.role !== 'admin') {
    // Si no es admin, solo puede ver su propio usuario
    const res = await db.query('SELECT id, username, email, first_name, last_name, phone, status, role, created_at, updated_at FROM users WHERE id = $1', [user.id])
    return c.json({ users: res.rows })
  }
  // Filtros y paginación
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit
  let query = 'SELECT id, username, email, first_name, last_name, phone, status, role, created_at, updated_at FROM users'
  let where = []
  let params = []
  let i = 1
  if (c.req.query('search')) {
    where.push('(username ILIKE $' + i + ' OR email ILIKE $' + i + ' OR first_name ILIKE $' + i + ' OR last_name ILIKE $' + i + ')')
    params.push('%' + c.req.query('search') + '%')
    i++
  }
  if (c.req.query('status')) {
    where.push('status = $' + i)
    params.push(c.req.query('status'))
    i++
  }
  if (where.length) {
    query += ' WHERE ' + where.join(' AND ')
  }
  // Ordenamiento
  const sortBy = c.req.query('sortBy') || 'created_at'
  const sortOrder = c.req.query('sortOrder') === 'asc' ? 'ASC' : 'DESC'
  query += ` ORDER BY ${sortBy} ${sortOrder}`
  query += ` LIMIT $${i} OFFSET $${i + 1}`
  params.push(limit, offset)
  const res = await db.query(query, params)
  return c.json({ users: res.rows })
})

// Crear usuario (solo admin)
app.post('/users', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden', message: 'Sin permisos de administrador' }, 403)
  }
  const body = await c.req.json()
  const { username, email, password, firstName, lastName, phone, role, status } = body
  if (!username || !email || !password || !firstName || !lastName) {
    return c.json({ error: 'Validation failed', message: 'Campos requeridos faltantes' }, 400)
  }
  const exists = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username])
  if (exists.rows.length > 0) {
    return c.json({ error: 'Conflict', message: 'Usuario o email ya existe' }, 409)
  }
  const hash = await bcrypt.hash(password, 10)
  const result = await db.query(
    'INSERT INTO users (username, email, password, first_name, last_name, phone, status, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [username, email, hash, firstName, lastName, phone || null, status || 'active', role || 'user']
  )
  return c.json({ message: 'Usuario creado exitosamente', id: result.rows[0].id }, 201)
})

// Obtener usuario por ID
app.get('/users/:userId', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const { userId } = c.req.param()
  if (user.role !== 'admin' && user.id !== userId) {
    return c.json({ error: 'Forbidden', message: 'Sin permisos para ver este usuario' }, 403)
  }
  const res = await db.query('SELECT id, username, email, first_name, last_name, phone, status, role, created_at, updated_at FROM users WHERE id = $1', [userId])
  if (res.rows.length === 0) return c.json({ error: 'Not found', message: 'Usuario no encontrado' }, 404)
  return c.json(res.rows[0])
})

// Actualizar usuario completo
app.put('/users/:userId', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const { userId } = c.req.param()
  const body = await c.req.json()
  const { firstName, lastName, phone, status, role } = body
  if (user.role !== 'admin' && user.id !== userId) {
    return c.json({ error: 'Forbidden', message: 'Sin permisos para actualizar este usuario' }, 403)
  }
  if (!firstName || !lastName) {
    return c.json({ error: 'Validation failed', message: 'Campos requeridos faltantes' }, 400)
  }
  await db.query('UPDATE users SET first_name = $1, last_name = $2, phone = $3, status = $4, role = $5, updated_at = NOW() WHERE id = $6', [firstName, lastName, phone || null, status || 'active', role || 'user', userId])
  return c.json({ message: 'Usuario actualizado exitosamente' })
})

// Actualizar usuario parcialmente
app.patch('/users/:userId', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const { userId } = c.req.param()
  const body = await c.req.json()
  if (user.role !== 'admin' && user.id !== userId) {
    return c.json({ error: 'Forbidden', message: 'Sin permisos para actualizar este usuario' }, 403)
  }
  const fields = []
  const values = []
  let i = 1
  for (const key of ['firstName', 'lastName', 'phone', 'status', 'role']) {
    if (body[key]) {
      fields.push(`${key === 'firstName' ? 'first_name' : key === 'lastName' ? 'last_name' : key} = $${i}`)
      values.push(body[key])
      i++
    }
  }
  if (!fields.length) {
    return c.json({ error: 'Validation failed', message: 'Sin campos para actualizar' }, 400)
  }
  values.push(userId)
  await db.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values)
  return c.json({ message: 'Usuario actualizado exitosamente' })
})

// Eliminar usuario
app.delete('/users/:userId', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const { userId } = c.req.param()
  if (user.role !== 'admin' && user.id !== userId) {
    return c.json({ error: 'Forbidden', message: 'Sin permisos para eliminar este usuario' }, 403)
  }
  await db.query('DELETE FROM users WHERE id = $1', [userId])
  return c.json({ message: 'Usuario eliminado exitosamente' })
})

// ========== PERFIL DEL USUARIO ACTUAL ==========
// Obtener perfil del usuario actual
app.get('/users/me', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const res = await db.query('SELECT id, username, email, first_name, last_name, phone, status, role, created_at, updated_at FROM users WHERE id = $1', [user.id])
  if (res.rows.length === 0) return c.json({ error: 'Not found', message: 'Usuario no encontrado' }, 404)
  return c.json(res.rows[0])
})

// Actualizar perfil completo
app.put('/users/me', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const body = await c.req.json()
  const { firstName, lastName, phone } = body
  if (!firstName || !lastName) {
    return c.json({ error: 'Validation failed', message: 'Campos requeridos faltantes' }, 400)
  }
  await db.query('UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() WHERE id = $4', [firstName, lastName, phone || null, user.id])
  return c.json({ message: 'Perfil actualizado exitosamente' })
})

// Cambiar contraseña
app.put('/users/me/password', authMiddleware, async (c) => {
  const user = (c.req as any).user as UserPayload
  const body = await c.req.json()
  const { currentPassword, newPassword } = body
  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Validation failed', message: 'Contraseñas requeridas' }, 400)
  }
  const res = await db.query('SELECT password FROM users WHERE id = $1', [user.id])
  const valid = await bcrypt.compare(currentPassword, res.rows[0].password)
  if (!valid) {
    return c.json({ error: 'Unauthorized', message: 'Contraseña actual incorrecta' }, 401)
  }
  const hash = await bcrypt.hash(newPassword, 10)
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id])
  return c.json({ message: 'Contraseña cambiada exitosamente' })
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

