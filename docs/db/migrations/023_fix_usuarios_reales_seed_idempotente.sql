-- 023_fix_usuarios_reales_seed_idempotente.sql
--
-- El smoke FULL ("valida usuarios reales seed, roles y emails sin .test") exige
-- que existan pablo.admin, maria.contador y katia.admin. En la base actual sólo
-- quedaban dos: `persona.persona_usuario` de Katia (900003) y las asignaciones de
-- rol SUPER_ADMIN de los dos administradores habían desaparecido, aunque la
-- persona y su registro de empleado seguían ahí.
--
-- Causa: la limpieza del usuario oficial tenía un alcance que seleccionaba a
-- *todos* los superadministradores (predicado por `tipo_usuario`), de modo que
-- borraba sesiones, roles y cuentas de administradores que el seed nunca creó.
-- El alcance ya está corregido en `scripts/official-user-utils.js`, pero el daño
-- quedó grabado en la base: las migraciones 009 y 010, que sembraban a los tres
-- usuarios, ya figuran como aplicadas en `infraestructura.schema_migrations` y
-- por diseño no vuelven a ejecutarse. Nada restauraba lo borrado.
--
-- Esta migración reconstruye el estado que el smoke declara como invariante.
--
-- Dos cuidados que las migraciones 009/010 no tenían:
--   1) No se sobrescribe `contrasena_hash`. Las cuentas vivas ya migraron su hash
--      a scrypt salado en su primer inicio de sesión (PasswordHasherService);
--      reescribir el SHA-256 histórico las degradaría a cada despliegue.
--   2) No se pisa un `nombre_usuario` que hoy pertenezca a otra persona: la
--      columna es UNIQUE y la inserción fallaría abortando toda la migración.
--
-- Idempotente: puede ejecutarse varias veces sin duplicar ni perder datos.

-- ---------------------------------------------------------------------------
-- 1) Personas base con correo operativo @cpa.com
-- ---------------------------------------------------------------------------

INSERT INTO persona.persona (id_persona, nombres, apellidos, email, estado_registro)
VALUES
  (900001, 'Pablo', 'Arauz Caballero', 'pablo.admin@cpa.com', 'Activo'),
  (900002, 'Maria Sonia', 'Caballero', 'maria.contador@cpa.com', 'Activo'),
  (900003, 'Katia', 'Caballero Ardaya', 'katia.admin@cpa.com', 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(persona.persona.version_registro, 1) + 1;

-- ---------------------------------------------------------------------------
-- 2) Cuentas de acceso
--
-- El hash sólo se escribe al crear la fila: es el SHA-256 histórico documentado
-- en la migración 009 (PabloAdmin2026! / MariaContador2026! / KatiaAdmin2026!),
-- que el verificador acepta como formato heredado y sustituye por scrypt en el
-- siguiente inicio de sesión correcto.
-- ---------------------------------------------------------------------------

INSERT INTO persona.persona_usuario (
  id_persona,
  nombre_usuario,
  contrasena_hash,
  tipo_usuario,
  estado_registro,
  es_super_usuario
)
SELECT v.id_persona, v.nombre_usuario, v.contrasena_hash, v.tipo_usuario, 'Activo', v.es_super_usuario
FROM (
  VALUES
    (900001::bigint, 'pablo.admin', '89e5c3c5101fe178aace4586f09da37648ac3b21bd57135ca3e99b6ace9cfd63', 'SUPER_ADMIN', TRUE),
    (900002::bigint, 'maria.contador', 'a531e5f8d7ae8b3b6649c76d729621e879d4eb4c3b4b57b0a4f61b35bdba4b6e', 'CONTADOR', FALSE),
    (900003::bigint, 'katia.admin', '6e97d5a01ae1afc34261511da5d51b7a94016be1f70d547680fee6f3ff48edc6', 'SUPER_ADMIN', TRUE)
) AS v(id_persona, nombre_usuario, contrasena_hash, tipo_usuario, es_super_usuario)
WHERE NOT EXISTS (
  SELECT 1
  FROM persona.persona_usuario u
  WHERE LOWER(u.nombre_usuario) = LOWER(v.nombre_usuario)
    AND u.id_persona <> v.id_persona
)
ON CONFLICT (id_persona) DO UPDATE SET
  nombre_usuario = EXCLUDED.nombre_usuario,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_registro = 'Activo',
  es_super_usuario = EXCLUDED.es_super_usuario,
  fecha_modificacion = NOW(),
  version_registro = COALESCE(persona.persona_usuario.version_registro, 1) + 1;

-- ---------------------------------------------------------------------------
-- 3) Roles: administración para Pablo y Katia, contabilidad para Maria
-- ---------------------------------------------------------------------------

INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT u.id_persona, r.id_rol, 'Activo'
FROM (VALUES (900001::bigint), (900003::bigint)) AS u(id_persona)
JOIN seguridad.rol r ON r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
WHERE EXISTS (SELECT 1 FROM persona.persona_usuario pu WHERE pu.id_persona = u.id_persona)
ON CONFLICT (id_persona, id_rol) DO UPDATE SET
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.usuario_rol.version_registro, 1) + 1;

INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT 900002, r.id_rol, 'Activo'
FROM seguridad.rol r
WHERE r.codigo IN ('CONTADOR_GENERAL', 'CONTADOR')
  AND EXISTS (SELECT 1 FROM persona.persona_usuario pu WHERE pu.id_persona = 900002)
ON CONFLICT (id_persona, id_rol) DO UPDATE SET
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.usuario_rol.version_registro, 1) + 1;

-- ---------------------------------------------------------------------------
-- 4) Empleada administrativa de Katia (la 009 ya la creaba; se re-asegura por si
--    la base viene de un estado en el que sólo quedó la persona)
-- ---------------------------------------------------------------------------

INSERT INTO administracion.empleado (
  id_persona,
  fecha_ingreso,
  tipo_contrato,
  jornada,
  email_corporativo,
  id_sucursal,
  estado_registro
)
SELECT
  900003,
  DATE '2026-01-01',
  'INDEFINIDO'::administracion.tipo_contrato,
  'FULL_TIME'::administracion.jornada_laboral,
  'katia.admin@cpa.com',
  (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo = 'SCZ-CENTRO'),
  'Activo'
WHERE EXISTS (SELECT 1 FROM persona.persona WHERE id_persona = 900003)
ON CONFLICT (id_persona) DO UPDATE SET
  email_corporativo = EXCLUDED.email_corporativo,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(administracion.empleado.version_registro, 1) + 1;
