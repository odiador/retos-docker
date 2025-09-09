import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import db from '../db.js'
import bcrypt from 'bcryptjs'
import authMw from '../auth-mw.js'

const SCHEMA = process.env.DB_SCHEMA || 'auth'
const users = new OpenAPIHono()

// Shared user schema
const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
})

users.openapi(createRoute({
  method: 'get',
  path: '/accounts/{username}',
  middleware: [authMw],
  request: {
    params: z.object({
      username: z.string()
        .min(3, 'Username debe tener al menos 3 caracteres')
        .max(20, 'Username no puede tener más de 20 caracteres')
    })
  },
  responses: {
    200: { description: 'Perfil del usuario', content: { 'application/json': { schema: z.object({ user: userSchema }) } } },
    401: { description: 'No autenticado' },
    403: { description: 'No autorizado para ver este usuario' },
    404: { description: 'Usuario no encontrado' }
  },
}), async (c) => {
  const decoded = c.get('user')
  const { username } = c.req.valid('param')
  
  console.log('Usuario decodificado:', decoded)
  console.log('Username del parámetro:', username)
 
  if (!decoded || !decoded.uid) {
    return c.json({ error: 'No autenticado' }, 401)
  }
 
  if (decoded.sub !== username) {
    console.log(`username no coincide: ${decoded.sub} !== ${username}`)
    return c.json({ error: 'No autorizado' }, 403)
  }
  const result = await db(`SELECT id, username, email, first_name AS "firstName", last_name AS "lastName", phone, role, status, created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt" FROM ${SCHEMA}.users WHERE username=$1 LIMIT 1`, [username])
  if (result.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
  return c.json({ user: result.rows[0] })
})

/* =====================
   PATCH /users/me
===================== */
const patchBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
})

users.openapi(createRoute({
  method: 'patch',
  path: '/accounts/me',
  middleware: [authMw],
  request: { body: { content: { 'application/json': { schema: patchBody } } } },
  responses: {
    200: { description: 'Perfil actualizado', content: { 'application/json': { schema: z.object({ user: userSchema }) } } },
    400: { description: 'Sin cambios' },
    401: { description: 'No autenticado' }
  },
}), async (c) => {
  const decoded = c.get('user')
  if (!decoded || !decoded.uid) return c.json({ error: 'No autenticado' }, 401)
  const { firstName, lastName, phone } = c.req.valid('json')

  const sets = []
  const params = []
  let i = 1
  if (firstName) { sets.push(`first_name = $${i++}`); params.push(firstName) }
  if (lastName) { sets.push(`last_name = $${i++}`); params.push(lastName) }
  if (phone) { sets.push(`phone = $${i++}`); params.push(phone) }
  if (sets.length === 0) return c.json({ error: 'No hay campos para actualizar' }, 400)
  params.push(decoded.uid)
  const sql = `UPDATE ${SCHEMA}.users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING id, username, email, first_name AS "firstName", last_name AS "lastName", phone, role, status, created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt"`
  const updated = await db(sql, params)
  return c.json({ user: updated.rows[0] })
})

/* =====================
   PUT /users/me/password
===================== */
const changePassBody = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

users.openapi(createRoute({
  method: 'put',
  path: '/accounts/me/password',
  middleware: [authMw],
  request: { body: { content: { 'application/json': { schema: changePassBody } } } },
  responses: {
    200: { description: 'Contraseña cambiada', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    400: { description: 'Validación fallida' },
    401: { description: 'No autenticado' },
    404: { description: 'Usuario no encontrado' }
  },
}), async (c) => {
  const decoded = c.get('user')
  if (!decoded || !decoded.uid) return c.json({ error: 'No autenticado' }, 401)
  const { currentPassword, newPassword } = c.req.valid('json')
  if (newPassword.length < 8) return c.json({ error: 'Contraseña demasiado corta' }, 400)

  const result = await db(`SELECT password_hash FROM ${SCHEMA}.users WHERE id=$1 LIMIT 1`, [decoded.uid])
  if (result.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
  const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
  if (!match) return c.json({ error: 'Contraseña actual incorrecta' }, 401)
  const newHash = await bcrypt.hash(newPassword, 10)
  await db(`UPDATE ${SCHEMA}.users SET password_hash=$1, updated_at = NOW() WHERE id=$2`, [newHash, decoded.uid])
  return c.json({ message: 'Contraseña cambiada' })
})

/* =====================
   GET /users (admin list with pagination)
===================== */
const listQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

const listResp = z.object({
  items: z.array(userSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

users.openapi(createRoute({
  method: 'get',
  path: '/admin/accounts',
  middleware: [authMw],
  request: { query: listQuery },
  responses: { 200: { description: 'Lista de usuarios', content: { 'application/json': { schema: listResp } } }, 401: { description: 'No autenticado' }, 403: { description: 'Acceso denegado' } },
}), async (c) => {
  const decoded = c.get('user')
  if (!decoded || !decoded.uid) return c.json({ error: 'No autenticado' }, 401)

  // Check admin
  const me = await db(`SELECT role FROM ${SCHEMA}.users WHERE id=$1 LIMIT 1`, [decoded.uid])
  if (me.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
  if (me.rows[0].role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)

  const q = c.req.query()
  const page = Math.max(1, parseInt(q.page || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(q.limit || '25', 10)))
  const offset = (page - 1) * limit
  const search = q.search || null
  const status = q.status || null
  const sortBy = q.sortBy || 'created_at'
  const sortOrder = (q.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  const allowedSort = ['id', 'username', 'email', 'created_at', 'updated_at', 'last_login_at']
  const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at'

  const where = []
  const params = []
  let idx = 1
  if (search) { where.push(`(username ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++ }
  if (status) { where.push(`status = $${idx}`); params.push(status); idx++ }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalRes = await db(`SELECT COUNT(*) AS total FROM ${SCHEMA}.users ${whereSql}`, params)
  const total = Number(totalRes.rows[0].total || 0)

  params.push(limit); params.push(offset)
  const sql = `SELECT id, username, email, first_name AS "firstName", last_name AS "lastName", phone, role, status, created_at AS "createdAt", updated_at AS "updatedAt", last_login_at AS "lastLoginAt" FROM ${SCHEMA}.users ${whereSql} ORDER BY ${sortCol} ${sortOrder} LIMIT $${idx} OFFSET $${idx + 1}`
  const res = await db(sql, params)
  return c.json({ items: res.rows, total, page, limit })
})

users.openapi(createRoute({
  method: 'delete',
  path: '/accounts/me',
  middleware: [authMw],
  responses: {
    200: { description: 'Cuenta eliminada', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    401: { description: 'No autenticado' },
    404: { description: 'Usuario no encontrado' }
  },
}), async (c) => {
  const decoded = c.get('user')
  if (!decoded || !decoded.uid) return c.json({ error: 'No autenticado' }, 401)
  const result = await db(`DELETE FROM ${SCHEMA}.users WHERE id=$1 RETURNING id`, [decoded.uid])
  if (result.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
  return c.json({ message: 'Cuenta eliminada' })
})

export default users
