# Postman

Importa `CPA Plataforma NestJS.postman_collection.json`.

Variables útiles:

- `baseUrl`: `http://localhost:3000/api`
- `sessionToken`: se llena automáticamente con `data.sessionToken` devuelto por login.

Antes de probar Postman ejecuta:

```bash
npm run db:seed:demo
```

Credenciales demo:

```txt
Email: admin.demo@cpa.test
Password: DemoAdmin123!
```

El sistema queda como privado: `AUTH_REQUIRED=true` y `ENABLE_PUBLIC_SIGNUP=false`.
