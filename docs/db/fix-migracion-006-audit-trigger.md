# Fix migración 006 - función de auditoría faltante

## Problema

Al ejecutar:

```bash
yarn db:migrate:prod:fresh
```

la migración fallaba en:

```txt
RUN  006_patch_cuentas_operativas_por_persona.sql
function seguridad.fn_set_audit_update() does not exist
```

## Causa

La migración `006_patch_cuentas_operativas_por_persona.sql` creaba un trigger de actualización para `contabilidad.configuracion_cuenta_operativa`, pero asumía que ya existía la función:

```sql
seguridad.fn_set_audit_update()
```

El schema base `001_create_database_schema.sql` no crea esa función.

## Corrección

Se agregó dentro de la migración `006` una función mínima e idempotente:

```sql
CREATE OR REPLACE FUNCTION seguridad.fn_set_audit_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fecha_modificacion := now();
  NEW.version_registro := COALESCE(OLD.version_registro, NEW.version_registro, 1) + 1;
  RETURN NEW;
END;
$$;
```

También se hizo idempotente el trigger:

```sql
DROP TRIGGER IF EXISTS bu_configuracion_cuenta_operativa ON contabilidad.configuracion_cuenta_operativa;
CREATE TRIGGER bu_configuracion_cuenta_operativa
  BEFORE UPDATE ON contabilidad.configuracion_cuenta_operativa
  FOR EACH ROW EXECUTE FUNCTION seguridad.fn_set_audit_update();
```

## Comando recomendado

Como tu producción está en blanco, vuelve a correr:

```bash
yarn db:migrate:prod:fresh
```
