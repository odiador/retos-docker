import { OpenAPIHono } from '@hono/zod-openapi'

export const app = new OpenAPIHono({
  openapi: {
    info: {
      title: 'API Backend Hono',
      version: '1.0.0',
      description: 'Documentación OpenAPI generada automáticamente',
    },
    servers: [
      { url: 'http://localhost:90', description: 'Local' },
    ],
  },
})