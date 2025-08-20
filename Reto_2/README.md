Reto 2 - Servidor con Hono

Instrucciones:

1. Construir y levantar con docker compose:

   docker compose up --build

2. Probar rutas:

   - http://localhost/saludo?nombre=Juan => 200 "Hola Juan"
   - http://localhost/saludo => 400 "Solicitud no valida: El nombre es obligatorio"
   - http://localhost/otra => 404 "Recurso no encontrado"
