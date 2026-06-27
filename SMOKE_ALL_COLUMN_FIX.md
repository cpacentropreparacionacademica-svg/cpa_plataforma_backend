# Fix smoke:all - cleanup demo persona

Este paquete corrige `scripts/demo-user-utils.js` para que el cleanup del smoke antiguo no consulte columnas inexistentes.

Cambios:

- `persona.persona_tutor` ahora se valida por `id_persona`, no por `id_tutor`.
- Se elimina la validación inválida `persona.persona_padre.pp.id_persona`, porque `persona_padre` no tiene esa columna en este DDL.
- Se elimina la validación inválida `persona.proveedor.pr.id_persona`, porque `proveedor` no tiene esa columna en este DDL.

Comandos recomendados:

```powershell
yarn test:smoke

yarn test:smoke:all
```
