import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import db from '../db.js'

const SCHEMA = process.env.DB_SCHEMA || 'auth'
const users = new OpenAPIHono()

/* =====================
   GET /users/me
===================== */
const meResp = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
})

users.openapi(createRoute({
  method: 'get',
  path: '/users/me',
  responses: { 200: { description: 'Perfil del usuario', content: { 'application/json': { schema: meResp } } } },
}), async (c) => {
  // ⚡ Aquí deberías obtener el usuario del JWT en `c.get('user')`
  const uid = 'mock-user-id' // <--- reemplazar con auth real
  const result = await db.query(
    `SELECT id,username,email,role,status FROM ${SCHEMA}.users WHERE id=$1`,
    [uid]
  )
  if (result.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
  return c.json(result.rows[0])
})

/* =====================
   PATCH /users/me
===================== */
const patchBody = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

const patchResp = z.object({
  message: z.string(),
})

users.openapi(createRoute({
  method: 'patch',
  path: '/users/me',
  request: { body: { content: { 'application/json': { schema: patchBody } } } },
  responses: { 200: { description: 'Perfil actualizado', content: { 'application/json': { schema: patchResp } } } },
}), async (c) => {
  const { firstName, lastName } = c.req.valid('json')
  const uid = 'mock-user-id' // ⚡ reemplazar con auth real

  await db.query(
    `UPDATE ${SCHEMA}.users SET first_name=$1, last_name=$2 WHERE id=$3`,
    [firstName, lastName, uid]
  )
  return c.json({ message: 'Perfil actualizado' })
})

/* =====================
   PATCH /users/me/password
===================== */
const passBody = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
})

const passResp = z.object({
  message: z.string(),
})

users.openapi(createRoute({
  method: 'patch',
  path: '/users/me/password',
  request: { body: { content: { 'application/json': { schema: passBody } } } },
  responses: { 200: { description: 'Password actualizado', content: { 'application/json': { schema: passResp } } } },
}), async (c) => {
  const { oldPassword, newPassword } = c.req.valid('json')
  const uid = 'mock-user-id' // ⚡ reemplazar con auth real

  const result = await db.query(
    `SELECT password_hash FROM ${SCHEMA}.users WHERE id=$1`,
    [uid]
  )
  if (result.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)

  const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash)
  if (!valid) return c.json({ error: 'Contraseña actual incorrecta' }, 400)

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await db.query(`UPDATE ${SCHEMA}.users SET password_hash=$1 WHERE id=$2`, [passwordHash, uid])

  return c.json({ message: 'Contraseña actualizada' })
})

/* =====================
   GET /users (admin)
===================== */
const userListResp = z.array(meResp)

users.openapi(createRoute({
  method: 'get',
  path: '/users',
  responses: { 200: { description: 'Lista de usuarios', content: { 'application/json': { schema: userListResp } } } },
}), async (c) => {
  const result = await db.query(
    `SELECT id,username,email,role,status FROM ${SCHEMA}.users ORDER BY created_at DESC`
  )
  return c.json(result.rows)
})

export default users
