-- 009_patch_usuarios_reales_katia_y_login_usuario.sql
-- Objetivo:
-- 1) Reemplazar correos ficticios .test/NULL por correos operativos @cpa.com.
-- 2) Agregar una administradora adicional: Katia Caballero Ardaya.
-- 3) Mantener login operativo por email o por nombre_usuario.

BEGIN;

INSERT INTO persona.persona (id_persona, nombres, apellidos, telefono, fecha_nacimiento, email, estado_registro)
VALUES
  (900001, 'Pablo', 'Arauz Caballero', NULL, NULL, 'pablo.admin@cpa.com', 'Activo'),
  (900002, 'Maria Sonia', 'Caballero', NULL, NULL, 'maria.contador@cpa.com', 'Activo'),
  (900003, 'Katia', 'Caballero Ardaya', NULL, NULL, 'katia.admin@cpa.com', 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  telefono = EXCLUDED.telefono,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  email = EXCLUDED.email,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(persona.persona.version_registro, 1) + 1;

-- Hashes SHA-256 compatibles con AuthService.
-- PabloAdmin2026!      -> 89e5c3c5101fe178aace4586f09da37648ac3b21bd57135ca3e99b6ace9cfd63
-- MariaContador2026!   -> a531e5f8d7ae8b3b6649c76d729621e879d4eb4c3b4b57b0a4f61b35bdba4b6e
-- KatiaAdmin2026!      -> 6e97d5a01ae1afc34261511da5d51b7a94016be1f70d547680fee6f3ff48edc6
INSERT INTO persona.persona_usuario (id_persona, nombre_usuario, contrasena_hash, tipo_usuario, estado_registro, es_super_usuario)
VALUES
  (900001, 'pablo.admin', '89e5c3c5101fe178aace4586f09da37648ac3b21bd57135ca3e99b6ace9cfd63', 'SUPER_ADMIN', 'Activo', TRUE),
  (900002, 'maria.contador', 'a531e5f8d7ae8b3b6649c76d729621e879d4eb4c3b4b57b0a4f61b35bdba4b6e', 'CONTADOR', 'Activo', FALSE),
  (900003, 'katia.admin', '6e97d5a01ae1afc34261511da5d51b7a94016be1f70d547680fee6f3ff48edc6', 'SUPER_ADMIN', 'Activo', TRUE)
ON CONFLICT (id_persona) DO UPDATE SET
  nombre_usuario = EXCLUDED.nombre_usuario,
  contrasena_hash = EXCLUDED.contrasena_hash,
  tipo_usuario = EXCLUDED.tipo_usuario,
  estado_registro = 'Activo',
  es_super_usuario = EXCLUDED.es_super_usuario,
  fecha_modificacion = NOW(),
  version_registro = COALESCE(persona.persona_usuario.version_registro, 1) + 1;

-- Correos corporativos reales base.
UPDATE administracion.empleado e
SET email_corporativo = v.email_corporativo,
    fecha_modificacion = NOW(),
    version_registro = COALESCE(e.version_registro, 1) + 1
FROM (
  VALUES
    (900001::bigint, 'pablo.admin@cpa.com'),
    (900002::bigint, 'maria.contador@cpa.com'),
    (900003::bigint, 'katia.admin@cpa.com')
) AS v(id_persona, email_corporativo)
WHERE e.id_persona = v.id_persona;

-- Katia como empleada administrativa base.
INSERT INTO administracion.empleado (id_persona, fecha_ingreso, tipo_contrato, jornada, email_corporativo, id_sucursal, estado_registro)
VALUES (900003, '2026-01-01', 'INDEFINIDO'::administracion.tipo_contrato, 'FULL_TIME'::administracion.jornada_laboral, 'katia.admin@cpa.com', (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  tipo_contrato = EXCLUDED.tipo_contrato,
  jornada = EXCLUDED.jornada,
  email_corporativo = EXCLUDED.email_corporativo,
  id_sucursal = EXCLUDED.id_sucursal,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(administracion.empleado.version_registro, 1) + 1;

-- Roles para administradores.
INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT u.id_persona, r.id_rol, 'Activo'
FROM (VALUES (900001), (900003)) AS u(id_persona)
JOIN seguridad.rol r ON r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro='Activo';

-- Rol contador para Maria se mantiene.
INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT 900002, r.id_rol, 'Activo'
FROM seguridad.rol r
WHERE r.codigo IN ('CONTADOR_GENERAL', 'CONTADOR')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro='Activo';

COMMIT;
