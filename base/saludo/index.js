const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'

const app = new Hono()

const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Falta cabecera Authorization' }, 401)
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'JWT') {
    return c.json({ error: 'Formato de token invalido. Se espera: Authorization: JWT <token>' }, 401)
  }

  const token = parts[1]
  try {
    const decoded = jwt.verify(token, SECRET)
    // store decoded token under 'user' so handlers can retrieve it consistently
    c.set('user', decoded)
    await next()
  } catch (err) {
    console.error('[saludo] auth error:', err && err.message ? err.message : err)
    return c.json({ error: 'Token invalido o expirado' }, 401)
  }
}

app.get('/saludo', authMiddleware, (c) => {
  const nombre = c.req.query('nombre')
  if (!nombre) {
    return c.text('Solicitud no valida: El nombre es obligatorio', 400)
  }

  const user = c.get('user')
  if (!user || user.sub !== nombre) {
    console.warn('[saludo] user mismatch or missing')
    return c.json({ error: 'El nombre no coincide con el token' }, 403)
  }

  return c.json({ mensaje: `Hola ${nombre}` }, 200)
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({
  fetch: app.fetch,
  port: 80
})
