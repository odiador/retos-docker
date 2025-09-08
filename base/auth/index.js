import { serve } from '@hono/node-server'
import { app } from './app.js'
import auth from './routes/auth.js'
import health from './routes/health.js'
import users from './routes/users.js'
import { swaggerUI } from '@hono/swagger-ui'


// Montar rutas
app.route('/', health)
app.route('/', auth)
app.route('/', users)

app.get(
    '/ui',
    swaggerUI({
        url: '/doc',
    })
)

app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        title: 'Microservicios',
        version: '1.0.0',
        description: 'Reto numero 2 de microservicios',
    },
})

app.notFound((c) => c.text('Recurso no encontrado', 404))

serve({ fetch: app.fetch, port: 90 }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
},)
