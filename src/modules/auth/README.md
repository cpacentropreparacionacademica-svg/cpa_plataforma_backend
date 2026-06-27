# Auth

Migración de autenticación a NestJS sin JWT.  
La sesión usa un token opaco guardado en cookie HttpOnly y validado contra `seguridad.sesion.metadata.sessionTokenHash`.

Rutas conservadas:

> `POST /api/auth/publicAuth/signup` existe por compatibilidad, pero queda bloqueada por defecto con `ENABLE_PUBLIC_SIGNUP=false`. El usuario inicial/de prueba se crea desde `docs/db/seed-de prueba-user.sql`.

- `POST /api/auth/publicAuth/login`
- `POST /api/auth/publicAuth/signup`
- `POST /api/auth/publicAuth/change-password`
- `POST /api/auth/publicAuth/activate-user`
- `POST /api/auth/publicAuth/request-new-password-token`
- `GET /api/auth/privateAuth/me`
- `POST /api/auth/privateAuth/logout`
