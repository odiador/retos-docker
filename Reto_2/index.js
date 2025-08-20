const { Hono } = require('hono')
const http = require('http')

const app = new Hono()

// Ruta /saludo
app.get('/saludo', (c) => {
  const nombre = c.req.query('nombre')
  if (!nombre) {
    return c.text('Solicitud no valida: El nombre es obligatorio', 400)
  }
  return c.text(`Hola ${nombre}`, 200)
})

// Para cualquier otra ruta
app.notFound((c) => c.text('Recurso no encontrado', 404))

// Escuchar puerto usando un servidor HTTP nativo y forward a Hono
const port = Number(process.env.PORT || 80)

const server = http.createServer((req, res) => {
  // Construir un Request web estándar para Hono (GET no necesita body)
  const url = `http://localhost${req.url}`
  const request = new Request(url, {
    method: req.method,
    headers: req.headers
  })

  ;(async () => {
    try {
      // Normalizar el resultado: app.fetch puede devolver Response o Promise<Response>
      const response = await Promise.resolve(app.fetch(request))

      // Copiar status y headers
      res.statusCode = response.status
      response.headers.forEach((value, name) => {
        res.setHeader(name, value)
      })

      // Leer body como arrayBuffer y enviar
      const buffer = Buffer.from(await response.arrayBuffer())
      res.end(buffer)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })()
})

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`)
})
