-- 010_patch_ensure_real_users_maria_katia.sql
-- Objetivo:
-- Garantizar que los tres usuarios reales base existan, con correos @cpa.com,
-- aunque una base anterior haya quedado solo con pablo.admin por pruebas locales.

BEGIN;

INSERT INTO persona.persona (id_persona, nombres, apellidos, telefono, fecha_nacimiento, email, estado_registro)
VALUES
  (900001, 'Pablo', 'Arauz Caballero', NULL, NULL, 'pablo.admin@cpa.com', 'Activo'),
  (900002, 'Maria Sonia', 'Caballero', NULL, NULL, 'maria.contador@cpa.com', 'Activo'),
  (900003, 'Katia', 'Caballero Ardaya', NULL, NULL, 'katia.admin@cpa.com', 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET
  nombres = EXCLUDED.nombres,
  apellidos = EXCLUDED.apellidos,
  email = EXCLUDED.email,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(persona.persona.version_registro, 1) + 1;

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

INSERT INTO seguridad.rol (codigo, nombre, descripcion, estado_registro)
VALUES
  ('SUPER_ADMIN', 'Super administrador', 'Acceso total al sistema interno CPA.', 'Activo'),
  ('ADMIN_GENERAL', 'Administrador general', 'Administración general del sistema interno CPA.', 'Activo'),
  ('CONTADOR_GENERAL', 'Contador general', 'Gestión contable y financiera.', 'Activo'),
  ('CONTADOR', 'Contador', 'Rol alias operativo para contabilidad.', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.rol.version_registro, 1) + 1;

INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT u.id_persona, r.id_rol, 'Activo'
FROM (VALUES (900001), (900003)) AS u(id_persona)
JOIN seguridad.rol r ON r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro = 'Activo';

INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT 900002, r.id_rol, 'Activo'
FROM seguridad.rol r
WHERE r.codigo IN ('CONTADOR_GENERAL', 'CONTADOR')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro = 'Activo';

COMMIT;
