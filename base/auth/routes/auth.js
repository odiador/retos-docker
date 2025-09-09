import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import query from '../db.js'
import { parseTokenExpToSeconds } from '../utils/token.js'
import crypto from 'crypto'

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'
const SCHEMA = process.env.DB_SCHEMA || 'auth'

const auth = new OpenAPIHono()

const baseUserSchema = z.object({
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

/* =====================
  Registrar un nuevo usuario
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
  user: baseUserSchema,
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().nullable(),
})

auth.openapi(createRoute({
  method: 'post',
  path: '/accounts',
  request: {
    body: {
      content: {
        'application/json': { schema: registerBody }
      }
    }
  },
  responses: {
    201: { description: 'Usuario registrado', content: { 'application/json': { schema: registerResp } } },
    400: { description: 'Datos inválidos' },
    409: { description: 'Usuario existente' },
    500: { description: 'Error interno del servidor' }
  },
}), async (c) => {
  try {
    const { username, email, password, firstName, lastName } = c.req.valid('json')

    // Validación rápida antes de ir a BD
    if (!username || !email || !password) {
      return c.json({ error: 'Faltan campos obligatorios (username, email o password)' }, 400)
    }

    // Verificar si ya existe el usuario
    const existing = await query(
      `SELECT id FROM ${SCHEMA}.users WHERE username=$1 OR email=$2`,
      [username, email]
    )
    if (existing.rows.length > 0) {
      return c.json({ error: 'El usuario o correo ya están registrados' }, 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const insert = await query(
      `INSERT INTO ${SCHEMA}.users (username,email,password_hash,first_name,last_name)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id,username,email,first_name,last_name,phone,role,status,created_at,updated_at,last_login_at`,
      [username, email, passwordHash, firstName, lastName]
    )

    const row = insert.rows[0]
    const user = {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    }

    const token = jwt.sign(
      { sub: user.username, uid: user.id, role: user.role },
      SECRET,
      { expiresIn: TOKEN_EXP }
    )
    const expiresIn = parseTokenExpToSeconds(TOKEN_EXP)

    return c.json({
      message: 'Usuario registrado exitosamente',
      user,
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn
    }, 201)

  } catch (error) {
    console.error('Error al registrar usuario:', error)
    if (error.code === '23505') {
      return c.json({ error: 'El usuario o correo ya están registrados' }, 409)
    }

    return c.json({ error: 'Error interno del servidor' }, 500)
  }
})


/* =====================
  Realiza el inicio de sesión, dado el email y la contraseña
===================== */
const loginBody = z.object({
  identifier: z.string(), // username o email
  password: z.string(),
})

const loginResp = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().nullable(),
  user: baseUserSchema,
})

auth.openapi(createRoute({
  method: 'post',
  path: '/auth/login',
  request: {
    body: {
      content: {
        'application/json': { schema: loginBody }
      }
    }
  },
  responses: {
    200: { description: 'Login exitoso', content: { 'application/json': { schema: loginResp } } },
    400: { description: 'Datos inválidos' },
    401: { description: 'Credenciales inválidas' },
    500: { description: 'Error interno del servidor' }
  },
}), async (c) => {
  try {
    const { identifier, password } = c.req.valid('json')

    // Validación previa
    if (!identifier || !password) {
      return c.json({ error: 'Faltan campos obligatorios (identifier y password)' }, 400)
    }

    // Buscar usuario por username o email
    const result = await query(
      `SELECT id,username,email,password_hash,first_name,last_name,phone,role,status,created_at,updated_at,last_login_at 
       FROM ${SCHEMA}.users 
       WHERE username=$1 OR email=$1 
       LIMIT 1`,
      [identifier]
    )

    if (result.rows.length === 0) {
      return c.json({ error: 'Usuario no encontrado o credenciales inválidas' }, 401)
    }

    const row = result.rows[0]

    // Comparar contraseñas
    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) {
      return c.json({ error: 'Contraseña incorrecta' }, 401)
    }

    // Actualizar último login
    await query(`UPDATE ${SCHEMA}.users SET last_login_at = NOW() WHERE id=$1`, [row.id])

    // Construir usuario de respuesta
    const user = {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    }

    // Generar JWT
    const token = jwt.sign(
      { sub: row.username, uid: row.id, role: row.role },
      SECRET,
      { expiresIn: TOKEN_EXP }
    )
    const expiresIn = parseTokenExpToSeconds(TOKEN_EXP)

    return c.json({
      message: 'Login exitoso',
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user
    }, 200)

  } catch (error) {
    console.error('Error en login:', error)
    return c.json({ error: 'Error interno del servidor' }, 500)
  }
})


/* =====================
  Enviar el código de validación por email
===================== */
const forgotBody = z.object({
  email: z.string().email(),
})
const forgotResp = z.object({ message: z.string() })

auth.openapi(createRoute({
  method: 'post',
  path: '/passwords/validation-codes',
  request: {
    body: {
      content: {
        'application/json': { schema: forgotBody }
      }
    }
  },
  responses: {
    200: { description: 'Aceptado', content: { 'application/json': { schema: forgotResp } } },
    400: { description: 'Datos inválidos' },
    500: { description: 'Error interno del servidor' }
  },
}), async (c) => {
  try {
    const { email } = c.req.valid('json')

    if (!email) {
      return c.json({ error: 'El campo email es obligatorio' }, 400)
    }

    const res = await query(
      `SELECT id FROM ${SCHEMA}.users WHERE email=$1 LIMIT 1`,
      [email]
    )

    if (res.rows.length > 0) {
      const userId = res.rows[0].id
      const token = crypto.randomBytes(32).toString('hex')

      await query(
        `INSERT INTO ${SCHEMA}.password_resets (id,user_id,token,expires_at)
         VALUES (uuid_generate_v4(), $1, $2, NOW() + interval '1 hour')`,
        [userId, token]

        
      )

      // Aquí normalmente iría un servicio de envío de correo
      console.log(`[auth] Token de reseteo para ${email}: ${token}`)
    }

    // Seguridad: nunca revelar si el email existe o no
    return c.json({
      message: 'Si el email existe, recibirás instrucciones de recuperación'
    }, 200)

  } catch (error) {
    console.error('Error en forgot password:', error)
    return c.json({ error: 'Error interno del servidor' }, 500)
  }
})

export default auth
