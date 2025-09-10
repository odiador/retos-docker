import { OpenAPIHono } from '@hono/zod-openapi'

const health = new OpenAPIHono()

health.openapi({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  security: [], // Endpoint público - no requiere autenticación
  responses: {
    200: {
      description: 'Health check exitoso - El servicio está funcionando correctamente',
      content: {
        'text/plain': {
          schema: { type: 'string', description: 'Respuesta simple de estado' }
        }
      }
    }
  }
}, (c) => c.text('ok'))

export default health
