# Smoke FULL repetible

Se corrigió `test/smoke.full.spec.ts` para que la prueba de creación de estudiante/tutor no use IDs fijos (`990011`, `990012`).

Antes, al correr el smoke varias veces sobre la misma base, podía fallar con:

```txt
duplicate key value violates unique constraint "persona_pkey"
```

Ahora el smoke genera IDs dinámicos por corrida:

```ts
const SMOKE_ID_BASE = 991000 + Math.floor(Date.now() % 100000);
const SMOKE_STUDENT_PERSON_ID = SMOKE_ID_BASE;
const SMOKE_TUTOR_PERSON_ID = SMOKE_ID_BASE + 1;
```

Esto permite ejecutar:

```bash
yarn test:smoke:full
yarn test:smoke:all
```

varias veces sin depender de `db:migrate:prod:fresh` para limpiar esos IDs.
