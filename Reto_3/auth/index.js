const { serve } = require('@hono/node-server')
const { Hono } = require('hono')
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'

const app = new Hono()

// Ruta /saludo
app.get('/saludo', (c) => {
  const nombre = c.req.query('nombre')
  if (!nombre) {
    return c.text('Solicitud no valida: El nombre es obligatorio', 400)
  }
  return c.text(`Hola ${nombre}`, 200)
})

app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const username = body.username
    if (!username) {
      return c.json({ error: 'username es requerido' }, 400)
    }

    // En un sistema real se validaría credenciales
    const payload = { sub: username }
    const token = jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXP })

    return c.json({ access_token: token })
  } catch (err) {
    return c.json({ error: 'peticion invalida' }, 400)
  }
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({
  fetch: app.fetch,
  port: 80
})
