# Estructura de Base de Datos - API de Autenticación

Base de datos: `retos_microservicios`
Puerto: `5432`
Usuario: `postgres`
Contraseña: `Animacion3d*`

## Archivos SQL
- `001_extensions.sql`  → Extensiones útiles (`uuid-ossp`, `citext`)
- `010_schema.sql`      → Esquema `auth`
- `020_tables.sql`      → Tablas `users`, `password_resets`, `refresh_tokens`
- `030_indexes.sql`     → Índices recomendados
- `040_triggers.sql`    → Trigger `updated_at` para `users`

## Orden de ejecución
Ejecuta los scripts en este orden para crear la estructura:
1. 001_extensions.sql
2. 010_schema.sql
3. 020_tables.sql
4. 030_indexes.sql
5. 040_triggers.sql

## Ejecución manual (psql)
```powershell
# Crear base de datos (si no existe) y conectarse
psql -h localhost -U postgres -p 5432 -c "CREATE DATABASE retos_microservicios;"
psql -h localhost -U postgres -p 5432 -d retos_microservicios -f .\db\001_extensions.sql
psql -h localhost -U postgres -p 5432 -d retos_microservicios -f .\db\010_schema.sql
psql -h localhost -U postgres -p 5432 -d retos_microservicios -f .\db\020_tables.sql
psql -h localhost -U postgres -p 5432 -d retos_microservicios -f .\db\030_indexes.sql
psql -h localhost -U postgres -p 5432 -d retos_microservicios -f .\db\040_triggers.sql
```

## Notas
- `users.password_hash` almacena la contraseña hasheada (BCrypt/Argon2).
- `users.role` (`user`|`admin`) y `users.status` (`active`|`inactive`|`suspended`).
- `password_resets` almacena tokens de recuperación de contraseña.
- `refresh_tokens` está listo si luego implementas refresh tokens.
