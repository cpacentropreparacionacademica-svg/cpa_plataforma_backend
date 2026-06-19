# Base de datos

## Usuario demo interno

El sistema es privado: no se debe crear el usuario inicial desde un endpoint público.
Para pruebas locales se incluye un seed interno ejecutado desde Node:

```bash
npm run db:seed:demo
```

Ese comando primero ejecuta una limpieza segura de registros demo y luego crea o actualiza el usuario oficial.

El seed toma las credenciales desde `.env`:

```env
TEST_USER_ID=900001
TEST_USER_EMAIL=admin.demo@cpa.test
TEST_USER_USERNAME=admin.demo
TEST_USER_PASSWORD=DemoAdmin123!
```

También acepta los alias solicitados en el prompt:

```env
Email=admin.demo@cpa.test
Usuario=admin.demo
Password=DemoAdmin123!
```

El usuario se crea como `es_super_usuario = true` para poder probar todos los módulos sin depender de permisos parciales. En producción debes cambiar la contraseña o eliminar este usuario.

## Limpieza segura antes del seed

Puedes ejecutar solo la limpieza con:

```bash
npm run db:clean:demo
```

Alcance de limpieza:

- rango `TEST_USER_CLEAN_ID_FROM` a `TEST_USER_CLEAN_ID_TO`, por defecto `900001` a `900099`;
- email del test user;
- dominio del email del test user, por defecto `@cpa.test`;
- usuarios `admin.demo`, `demo`, `test`, `usuario.demo` y el usuario definido en `TEST_USER_USERNAME` / `Usuario`;
- tipos de usuario `ADMIN_DEMO`, `DEMO`, `TEST` y el definido en `TEST_USER_TYPE`.

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
npm run db:clean:demo
npm run db:seed:demo
```
