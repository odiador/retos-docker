import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'

export default async function authMw(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Falta cabecera Authorization' }, 401) 
  }
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2) {
    return c.json({ error: 'Formato de Authorization invalido' }, 401)
  }
  
  const scheme = parts[0]
  if (scheme !== 'JWT' && scheme !== 'Bearer') {
    return c.json({ error: 'Formato de token invalido' }, 401) 
  }
  
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, SECRET)
    c.set('user', decoded)
    await next() 
  } catch (err) {
    console.error('[auth-mw] token error', err.message)
    return c.json({ error: 'Token invalido o expirado' }, 401)
  }
}