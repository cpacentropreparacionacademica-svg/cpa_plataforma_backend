# Base de datos

## Usuario interno oficial

El sistema es privado: no se debe crear el usuario inicial desde un endpoint público.
Para pruebas locales se incluye un seed interno ejecutado desde Node:

```bash
yarn db:seed:official
```

Ese comando primero ejecuta una limpieza segura de registros demo y luego crea o actualiza el usuario oficial.

El seed toma las credenciales desde `.env`:

```env
TEST_USER_ID=900001
TEST_USER_EMAIL=pablo.admin@cpa.com
TEST_USER_USERNAME=pablo.admin
TEST_USER_PASSWORD=PabloAdmin2026!
```

También acepta los alias solicitados en el prompt:

```env
Email=pablo.admin@cpa.com
Usuario=pablo.admin
Password=PabloAdmin2026!
```

El usuario se crea como `es_super_usuario = true` para poder probar todos los módulos sin depender de permisos parciales. En producción debes cambiar la contraseña o eliminar este usuario.

## Limpieza segura antes del seed

Puedes ejecutar solo la limpieza con:

```bash
yarn db:clean:official
```

Alcance de limpieza:

- rango `TEST_USER_CLEAN_ID_FROM` a `TEST_USER_CLEAN_ID_TO`, por defecto `900001` a `900099`;
- email del test user;
- dominio del email del test user, por defecto `@cpa.test`;
- usuarios `pablo.admin`, `demo`, `test`, `usuario.demo` y el usuario definido en `TEST_USER_USERNAME` / `Usuario`;
- tipos de usuario `SUPER_ADMIN`, `DEMO`, `TEST` y el definido en `TEST_USER_TYPE`.

La limpieza borra sesiones, logs de sesión, tokens, roles/permisos y usuarios demo. La persona base solo se elimina si no tiene referencias de negocio restrictivas.

## Smoke test funcional

El smoke test ya ejecuta el seed antes de iniciar la app de prueba:

```bash
npm run test:smoke
```

Ese test hace login con el usuario definido en `.env`, toma `data.sessionToken` y recorre todos los endpoints CRUD registrados.

## Ejecución manual con psql

Los archivos SQL en esta carpeta son referencia documental. Para que el seed tome variables desde `.env`, usa los scripts Node:

```bash
yarn db:clean:official
yarn db:seed:official
```
