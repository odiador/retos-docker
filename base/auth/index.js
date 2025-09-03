const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('./db')

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

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({ fetch: app.fetch, port: 90 })
