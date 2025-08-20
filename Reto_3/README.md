Reto 3 - Autenticación JWT con Hono

Pasos:
1. Levantar ambos servicios:
   docker compose up --build

2. Generar token:
   curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"username":"juan"}'

3. Usar token para invocar servicio saludo en /saludo?nombre=juan añadiendo header Authorization: Bearer <token>

