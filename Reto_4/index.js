const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'

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
    c.set('user', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Token invalido o expirado' }, 401)
  }
}

app.get('/saludo', authMiddleware, (c) => {
  const nombre = c.req.query('nombre')
  if (!nombre) {
    return c.text('Solicitud no valida: El nombre es obligatorio', 400)
  }

  const user = c.get('user')
  if (user.sub !== nombre) {
    return c.json({ error: 'El nombre no coincide con el token' }, 403)
  }

  return c.json({ mensaje: `Hola ${nombre}` }, 200)
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({
  fetch: app.fetch,
  port: 80
})