import { serve } from '@hono/node-server'
import { app } from './app.js'
import auth from './routes/auth.js'
import health from './routes/health.js'
import users from './routes/users.js'
import { swaggerUI } from '@hono/swagger-ui'
import db from './db.js'
import bcrypt from 'bcryptjs'

async function ensureAdminUser() {
  const email = 'admin@gmail.com'
  const username = 'admin'
  const password = 'admin123'
  const SCHEMA = process.env.DB_SCHEMA || 'auth'
  try {
    const existing = await db(`SELECT id FROM ${SCHEMA}.users WHERE email=$1 OR username=$2 LIMIT 1`, [email, username])
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(password, 10)
      await db(`INSERT INTO ${SCHEMA}.users (username,email,password_hash,first_name,last_name,role,status) VALUES ($1,$2,$3,$4,$5,'admin','active')`, [username, email, hash, 'Admin', 'User'])
      console.log('[seed] Usuario admin creado: admin@gmail.com / admin123')
    } else {
      console.log('[seed] Usuario admin ya existe')
    }
  } catch (err) {
    console.error('[seed] Error creando usuario admin', err && err.message ? err.message : err)
  }
}

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

await ensureAdminUser()

serve({ fetch: app.fetch, port: 90 }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
},)
