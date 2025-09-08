import { OpenAPIHono } from '@hono/zod-openapi'

const health = new OpenAPIHono()

health.get('/health', (c) => c.text('ok'))

export default health
