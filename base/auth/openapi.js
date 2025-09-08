// index.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

// Crea la app con metadatos OpenAPI
const app = new OpenAPIHono({
  openapi: {
    info: {
      title: 'API Backend Hono',
      version: '1.0.0',
      description: 'Documentación OpenAPI generada automáticamente con Hono',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local',
      },
    ],
  },
})

// Ejemplo de ruta con OpenAPI
app.openapi(
  {
    method: 'post',
    path: '/oauth/callback',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              code: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Autenticación exitosa',
        content: {
          'application/json': {
            schema: z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
            }),
          },
        },
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json')
    // lógica real de auth
    return c.json({
      accessToken: 'fake-access',
      refreshToken: 'fake-refresh',
    })
  }
)

// Exportar la doc JSON en /doc
app.doc('/doc')

// Exportar Swagger UI en /swagger
import { serveStatic } from 'hono/serve-static.module'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const swaggerUiPath = require('swagger-ui-dist').absolutePath()
let swaggerHtml = readFileSync(resolve(swaggerUiPath, 'index.html'), 'utf-8')

// 👉 Apuntar el spec al /doc (OpenAPI 3 JSON)
swaggerHtml = swaggerHtml.replace(
  'https://petstore.swagger.io/v2/swagger.json',
  '/doc'
)

app.get('/swagger', (c) => c.html(swaggerHtml))
app.use('/swagger/*', serveStatic({ root: swaggerUiPath }))

export default app
