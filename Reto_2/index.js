import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

// Ruta /saludo
app.get('/saludo', (c) => {
  const nombre = c.req.query('nombre')
  if (!nombre) {
    return c.text('Solicitud no valida: El nombre es obligatorio', 400)
  }
  return c.text(`Hola ${nombre}`, 200)
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({
  fetch: app.fetch,
  port: 80
})