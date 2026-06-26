# Auth

Migración de autenticación a NestJS sin JWT.  
La sesión usa un token opaco guardado en cookie HttpOnly y validado contra `seguridad.sesion.metadata.sessionTokenHash`.

Rutas conservadas:

> `POST /api/auth/publicAuth/signup` no existe como flujo público. El sistema es interno: el usuario inicial/base se crea desde migraciones o scripts internos autorizados.

- `POST /api/auth/publicAuth/login`
- `POST /api/auth/publicAuth/change-password`
- `POST /api/auth/publicAuth/activate-user`
- `POST /api/auth/publicAuth/request-new-password-token`
- `GET /api/auth/privateAuth/me`
- `POST /api/auth/privateAuth/logout`
