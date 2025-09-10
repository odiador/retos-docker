Servicio de autenticación JWT (Hono)

Endpoints:

- POST /auth/login  -> body JSON { "username": "juan" }  => { "access_token": "..." }
- GET /health -> ok

Variables de entorno:
- JWT_SECRET: secreto para firmar tokens
- TOKEN_EXP: expiración (por ejemplo '1h')
- PORT: puerto del servicio (por defecto 3001)

Ejemplo curl:

curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"username":"juan"}'

