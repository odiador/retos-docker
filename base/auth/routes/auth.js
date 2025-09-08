import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import query from '../db.js'
import { parseTokenExpToSeconds } from '../utils/token.js'

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'
const SCHEMA = process.env.DB_SCHEMA || 'auth'

const auth = new OpenAPIHono()

/* =====================
   /auth/register
===================== */
const registerBody = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
})

const registerResp = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
    status: z.string(),
  }),
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().nullable(),
})

auth.openapi(createRoute({
  method: 'post',
  path: '/auth/register',
  request: { body: { content: { 'application/json': { schema: registerBody } } } },
  responses: { 201: { description: 'Usuario registrado', content: { 'application/json': { schema: registerResp } } } },
}), async (c) => {
  const { username, email, password, firstName, lastName } = c.req.valid('json')

  const existing = await query(
    `SELECT id FROM ${SCHEMA}.users WHERE username=$1 OR email=$2`,
    [username, email]
  )
  if (existing.rows.length > 0) return c.json({ error: 'User exists' }, 409)

  const passwordHash = await bcrypt.hash(password, 10)
  const insert = await query(
    `INSERT INTO ${SCHEMA}.users (username,email,password_hash,first_name,last_name) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,email,role,status,created_at`,
    [username, email, passwordHash, firstName, lastName]
  )
  const user = insert.rows[0]

  const token = jwt.sign({ sub: user.username, uid: user.id, role: user.role }, SECRET, { expiresIn: TOKEN_EXP })
  const expiresIn = parseTokenExpToSeconds(TOKEN_EXP)

  return c.json({ message: 'Usuario registrado exitosamente', user, access_token: token, token_type: 'Bearer', expires_in: expiresIn }, 201)
})

/* =====================
   /auth/login
===================== */
const loginBody = z.object({
  username: z.string(),
  password: z.string(),
})

const loginResp = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().nullable(),
})

auth.openapi(createRoute({
  method: 'post',
  path: '/auth/login',
  request: { body: { content: { 'application/json': { schema: loginBody } } } },
  responses: { 200: { description: 'Login exitoso', content: { 'application/json': { schema: loginResp } } } },
}), async (c) => {
  const { username, password } = c.req.valid('json')

  const result = await query(
    `SELECT id,username,password_hash,role FROM ${SCHEMA}.users WHERE username=$1`,
    [username]
  )
  if (result.rows.length === 0) return c.json({ error: 'Credenciales inválidas' }, 401)

  const user = result.rows[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return c.json({ error: 'Credenciales inválidas' }, 401)

  const token = jwt.sign({ sub: user.username, uid: user.id, role: user.role }, SECRET, { expiresIn: TOKEN_EXP })
  const expiresIn = parseTokenExpToSeconds(TOKEN_EXP)

  return c.json({ access_token: token, token_type: 'Bearer', expires_in: expiresIn })
})

/* =====================
   /auth/forgot-password
===================== */
const forgotBody = z.object({
  email: z.string().email(),
})

const forgotResp = z.object({
  message: z.string(),
})

auth.openapi(createRoute({
  method: 'post',
  path: '/auth/forgot-password',
  request: { body: { content: { 'application/json': { schema: forgotBody } } } },
  responses: { 200: { description: 'Email enviado', content: { 'application/json': { schema: forgotResp } } } },
}), async (c) => {
  const { email } = c.req.valid('json')

  const result = await query(`SELECT id FROM ${SCHEMA}.users WHERE email=$1`, [email])
  if (result.rows.length === 0) return c.json({ error: 'Email no encontrado' }, 404)

  // ⚡ Aquí deberías enviar el correo con link/token
  return c.json({ message: 'Email de recuperación enviado' })
})

/* =====================
   /auth/reset-password
===================== */
const resetBody = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

const resetResp = z.object({
  message: z.string(),
})

auth.openapi(createRoute({
  method: 'post',
  path: '/auth/reset-password',
  request: { body: { content: { 'application/json': { schema: resetBody } } } },
  responses: { 200: { description: 'Password reseteado', content: { 'application/json': { schema: resetResp } } } },
}), async (c) => {
  const { token, newPassword } = c.req.valid('json')

  try {
    const decoded = jwt.verify(token, SECRET)
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await query(
      `UPDATE ${SCHEMA}.users SET password_hash=$1 WHERE id=$2`,
      [passwordHash, decoded.uid]
    )
    return c.json({ message: 'Password actualizado exitosamente' })
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 400)
  }
})

export default auth
