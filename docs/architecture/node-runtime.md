# Node Runtime recomendado

Este backend está generado sobre NestJS 10. Para evitar warnings del CLI en modo watch, se recomienda usar Node 20 LTS.

Si aparece el warning `[DEP0190] Passing args to a child process with shell option true`, no viene del código de negocio ni del `PermissionGuard`; normalmente lo dispara una herramienta de desarrollo que lanza procesos hijos en modo watch.

Para rastrearlo en Windows PowerShell:

```powershell
$env:NODE_OPTIONS="--trace-deprecation"
npm run start:dev
```

También puedes ejecutar:

```bash
npm run start:dev:trace
```

Si la API inicia correctamente, el warning no bloquea el servidor. Para ambientes de entrega, usar Node 20 LTS o actualizar la versión del CLI cuando se confirme compatibilidad total.
