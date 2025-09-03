const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./db')
const authMw = require('./auth-mw')
const crypto = require('crypto')

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'
const SCHEMA = process.env.DB_SCHEMA || 'auth'

const app = new Hono()

app.get('/health', (c) => c.text('ok'))

// Register
app.post('/auth/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, email, password, firstName, lastName } = body
    if (!username || !email || !password || !firstName || !lastName) {
      return c.json({ error: 'Missing fields' }, 400)
    }

    // Check existing
    const existing = await db.query(`SELECT id FROM ${SCHEMA}.users WHERE username = $1 OR email = $2`, [username, email])
    if (existing.rows.length > 0) {
      return c.json({ error: 'User exists' }, 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const insert = await db.query(
      `INSERT INTO ${SCHEMA}.users (username, email, password_hash, first_name, last_name) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, role, status, created_at`,
      [username, email, passwordHash, firstName, lastName]
    )

    const user = insert.rows[0]
    const token = jwt.sign({ sub: user.username, uid: user.id }, SECRET, { expiresIn: TOKEN_EXP })
    return c.json({ message: 'User created', user, access_token: token }, 201)
  } catch (err) {
    console.error('[auth] register error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Login
app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const { identifier, password } = body
    if (!identifier || !password) {
      return c.json({ error: 'Missing credentials' }, 400)
    }

    const res = await db.query(`SELECT id, username, email, password_hash, role FROM ${SCHEMA}.users WHERE username = $1 OR email = $1 LIMIT 1`, [identifier])
    if (res.rows.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const user = res.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Update last_login_at
    await db.query(`UPDATE ${SCHEMA}.users SET last_login_at = NOW() WHERE id = $1`, [user.id])

    const token = jwt.sign({ sub: user.username, uid: user.id }, SECRET, { expiresIn: TOKEN_EXP })
    return c.json({ access_token: token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }, 200)
  } catch (err) {
    console.error('[auth] login error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Forgot password
app.post('/auth/forgot-password', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body
    if (!email) return c.json({ error: 'Email requerido' }, 400)

    const res = await db.query(`SELECT id FROM ${SCHEMA}.users WHERE email = $1 LIMIT 1`, [email])
    if (res.rows.length > 0) {
      const userId = res.rows[0].id
      const token = crypto.randomBytes(32).toString('hex')
      // expire in 1 hour
      await db.query(`INSERT INTO ${SCHEMA}.password_resets (id, user_id, token, expires_at) VALUES (uuid_generate_v4(), $1, $2, NOW() + interval '1 hour')`, [userId, token])
      console.log(`[auth] password reset token for ${email}: ${token}`)
    }

    // Always return 200 to avoid email enumeration
    return c.json({ message: 'Si el email existe, se ha enviado un token de recuperación' }, 200)
  } catch (err) {
    console.error('[auth] forgot-password error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Reset password
app.post('/auth/reset-password', async (c) => {
  try {
    const body = await c.req.json()
    const { token, newPassword } = body
    if (!token || !newPassword) return c.json({ error: 'Token y nueva contraseña requeridos' }, 400)
    if (newPassword.length < 8) return c.json({ error: 'Contraseña demasiado corta' }, 400)

    const res = await db.query(`SELECT user_id FROM ${SCHEMA}.password_resets WHERE token = $1 AND expires_at > NOW() LIMIT 1`, [token])
    if (res.rows.length === 0) return c.json({ error: 'Token inválido o expirado' }, 410)

    const userId = res.rows[0].user_id
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.query(`UPDATE ${SCHEMA}.users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, userId])
    await db.query(`DELETE FROM ${SCHEMA}.password_resets WHERE token = $1`, [token])

    return c.json({ message: 'Contraseña actualizada' }, 200)
  } catch (err) {
    console.error('[auth] reset-password error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Protected: get current user profile
app.get('/users/me', authMw, async (c) => {
  try {
    const user = c.get('user')
    if (!user || !user.uid) return c.json({ error: 'No autenticado' }, 401)
    const res = await db.query(`SELECT id, username, email, first_name AS firstName, last_name AS lastName, phone, role, status, created_at, updated_at, last_login_at FROM ${SCHEMA}.users WHERE id = $1 LIMIT 1`, [user.uid])
    if (res.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
    return c.json({ user: res.rows[0] }, 200)
  } catch (err) {
    console.error('[auth] users/me error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Protected: patch current user (partial update)
app.patch('/users/me', authMw, async (c) => {
  try {
    const body = await c.req.json()
    const { firstName, lastName, phone } = body
    const user = c.get('user')
    if (!user || !user.uid) return c.json({ error: 'No autenticado' }, 401)

    // Build dynamic update
    const sets = []
    const params = []
    let idx = 1
    if (firstName) { sets.push(`first_name = $${idx++}`); params.push(firstName) }
    if (lastName) { sets.push(`last_name = $${idx++}`); params.push(lastName) }
    if (phone) { sets.push(`phone = $${idx++}`); params.push(phone) }
    if (sets.length === 0) return c.json({ error: 'No hay campos para actualizar' }, 400)

    params.push(user.uid)
    const sql = `UPDATE ${SCHEMA}.users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, username, email, first_name AS "firstName", last_name AS "lastName", phone, role, status, created_at, updated_at`
    const res = await db.query(sql, params)
    return c.json({ user: res.rows[0] }, 200)
  } catch (err) {
    console.error('[auth] users/me patch error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Protected: change password for current user
app.put('/users/me/password', authMw, async (c) => {
  try {
    const body = await c.req.json()
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword) return c.json({ error: 'currentPassword y newPassword requeridos' }, 400)
    if (newPassword.length < 8) return c.json({ error: 'Contraseña demasiado corta' }, 400)

    const user = c.get('user')
    if (!user || !user.uid) return c.json({ error: 'No autenticado' }, 401)

    const res = await db.query(`SELECT password_hash FROM ${SCHEMA}.users WHERE id = $1 LIMIT 1`, [user.uid])
    if (res.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)

    const match = await bcrypt.compare(currentPassword, res.rows[0].password_hash)
    if (!match) return c.json({ error: 'Contraseña actual incorrecta' }, 401)

    const newHash = await bcrypt.hash(newPassword, 10)
    await db.query(`UPDATE ${SCHEMA}.users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, user.uid])
    return c.json({ message: 'Contraseña cambiada' }, 200)
  } catch (err) {
    console.error('[auth] change-password error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

// Admin: list users with pagination
app.get('/users', authMw, async (c) => {
  try {
    const q = c.req.query()
    const page = Math.max(1, parseInt(q.page || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(q.limit || '25', 10)))
    const offset = (page - 1) * limit
    const search = q.search || null
    const status = q.status || null
    const sortBy = q.sortBy || 'created_at'
    const sortOrder = (q.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    // admin check
    const requester = c.get('user')
    if (!requester || !requester.uid) return c.json({ error: 'No autenticado' }, 401)
    const me = await db.query(`SELECT role FROM ${SCHEMA}.users WHERE id = $1 LIMIT 1`, [requester.uid])
    if (me.rows.length === 0) return c.json({ error: 'Usuario no encontrado' }, 404)
    if (me.rows[0].role !== 'admin') return c.json({ error: 'Acceso denegado' }, 403)

    // Build where clauses
    const where = []
    const params = []
    let idx = 1
    if (search) {
      where.push(`(username ILIKE $${idx} OR email ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }
    if (status) {
      where.push(`status = $${idx}`)
      params.push(status)
      idx++
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    // Validate sortBy allowed columns
    const allowedSort = ['id', 'username', 'email', 'created_at', 'updated_at', 'last_login_at']
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at'

    const totalRes = await db.query(`SELECT COUNT(*) AS total FROM ${SCHEMA}.users ${whereSql}`, params)
    const total = Number(totalRes.rows[0].total || 0)

    // add pagination params
    params.push(limit)
    params.push(offset)

    const sql = `SELECT id, username, email, first_name AS "firstName", last_name AS "lastName", phone, role, status, created_at, updated_at, last_login_at FROM ${SCHEMA}.users ${whereSql} ORDER BY ${sortCol} ${sortOrder} LIMIT $${idx} OFFSET $${idx + 1}`
    const res = await db.query(sql, params)

    return c.json({ items: res.rows, total, page, limit }, 200)
  } catch (err) {
    console.error('[auth] users list error', err && err.message ? err.message : err)
    return c.json({ error: 'Internal error' }, 500)
  }
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({ fetch: app.fetch, port: 90 })
