const { Hono } = require('hono')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const app = new Hono()

// Secret simple (en producción poner en variable de entorno)
const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'

app.use('*', (c, next) => {
  // Hono no tiene body parser integrado para Node; usamos bodyParser en el adaptador
  return next()
})

// Endpoint para obtener token: POST /auth/login { "username": "juan" }
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

// Simple health
app.get('/health', (c) => c.text('ok'))

// Levantar servidor HTTP nativo para compatibilidad con Node
const http = require('http')
const port = Number(process.env.PORT || 3001)
const server = http.createServer((req, res) => {
  const url = `http://localhost${req.url}`

  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    ;(async () => {
      try {
        const raw = Buffer.concat(chunks)
        const requestInit = {
          method: req.method,
          headers: req.headers
        }
        if (raw && raw.length > 0) {
          requestInit.body = raw
        }

        const request = new Request(url, requestInit)
        const response = await Promise.resolve(app.fetch(request))

        res.statusCode = response.status
        response.headers.forEach((v, n) => res.setHeader(n, v))
        const buffer = Buffer.from(await response.arrayBuffer())
        res.end(buffer)
      } catch (err) {
        console.error('auth error', err)
        res.statusCode = 500
        res.end('Internal Server Error')
      }
    })()
  })

  req.on('error', (err) => {
    console.error('request stream error', err)
    res.statusCode = 400
    res.end('Bad Request')
  })
})

server.listen(port, () => console.log(`Auth listening on ${port}`))
