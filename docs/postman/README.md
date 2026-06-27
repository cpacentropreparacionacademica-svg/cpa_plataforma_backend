# Postman

Importa `CPA Plataforma NestJS.postman_collection.json`.

Variables útiles:

- `baseUrl`: `http://localhost:3000/api`
- `sessionToken`: se llena automáticamente con `data.sessionToken` devuelto por login.

Antes de probar Postman ejecuta:

```bash
yarn db:seed:official
```

Credenciales oficiales de prueba:

```txt
Email: pablo.admin@cpa.com
Password: PabloAdmin2026!
```

El sistema queda como privado: `AUTH_REQUIRED=true` y `ENABLE_PUBLIC_SIGNUP=false`.
