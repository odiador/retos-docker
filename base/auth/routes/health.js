import { OpenAPIHono } from '@hono/zod-openapi'

const health = new OpenAPIHono()

health.openapi({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  responses: {
    200: {
      description: 'Health check',
      content: {
        'text/plain': {
          schema: { type: 'string' }
        }
      }
    }
  }
}, (c) => c.text('ok'))

export default health
