-- 013_seed_reporteria_contable_permisos.sql
-- Objetivo:
-- - Registrar permisos de reportería contable requeridos por el frontend de reportería.
-- - Asignarlos a roles contables y administrativos sin depender de permisos CRUD.
-- - Mantener compatibilidad con nombres actuales y alias usados por pantallas anteriores.
--
-- Esta migración es idempotente: puede ejecutarse varias veces sin duplicar permisos ni asignaciones.

INSERT INTO seguridad.permiso (codigo, descripcion, modulo, estado_registro)
VALUES
  ('REPORTERIA.CONTABILIDAD.READ', 'Acceder al módulo de reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.*', 'Acceso completo de lectura a reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABLE.READ', 'Acceder al panel de reportes contables', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABLE.*', 'Acceso completo de lectura al panel contable', 'REPORTERIA', 'Activo'),
  ('CONTABILIDAD.REPORTERIA.READ', 'Acceder a reportería contable desde contabilidad', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.REPORTES.READ', 'Acceder a reportes financieros de contabilidad', 'CONTABILIDAD', 'Activo'),

  ('REPORTERIA.CONTABILIDAD.LIBRO_DIARIO.READ', 'Ver libro diario en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.DIARIO.READ', 'Ver libro diario en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.LIBRO_MAYOR.READ', 'Ver libro mayor en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.MAYOR.READ', 'Ver libro mayor en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.ESTADO_RESULTADOS.READ', 'Ver estado de resultados en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.BALANCE_GENERAL.READ', 'Ver balance general en reportería contable', 'REPORTERIA', 'Activo'),
  ('REPORTERIA.CONTABILIDAD.FLUJO_CAJA.READ', 'Ver flujo de caja en reportería contable', 'REPORTERIA', 'Activo'),

  ('CONTABILIDAD.LIBRO_DIARIO.READ', 'Ver libro diario contable', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.LIBRO_MAYOR.READ', 'Ver libro mayor contable', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.EEFF.READ', 'Ver estados financieros contables', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ESTADO_RESULTADOS.READ', 'Ver estado de resultados contable', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.BALANCE_GENERAL.READ', 'Ver balance general contable', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.FLUJO_CAJA.READ', 'Ver flujo de caja contable', 'CONTABILIDAD', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.permiso.version_registro, 1) + 1;

INSERT INTO seguridad.rol (codigo, nombre, descripcion, estado_registro)
VALUES
  ('REPORTERIA_CONTABLE', 'Reportería contable', 'Rol de solo lectura para reportes contables y financieros', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.rol.version_registro, 1) + 1;

-- Roles administrativos y contables con acceso a la reportería financiera.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso, id_usuario_creador)
SELECT r.id_rol, p.id_permiso, NULL
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY[
  'REPORTERIA.CONTABILIDAD.READ',
  'REPORTERIA.CONTABILIDAD.*',
  'REPORTERIA.CONTABLE.READ',
  'REPORTERIA.CONTABLE.*',
  'CONTABILIDAD.REPORTERIA.READ',
  'CONTABILIDAD.REPORTES.READ',
  'REPORTERIA.CONTABILIDAD.LIBRO_DIARIO.READ',
  'REPORTERIA.CONTABILIDAD.DIARIO.READ',
  'REPORTERIA.CONTABILIDAD.LIBRO_MAYOR.READ',
  'REPORTERIA.CONTABILIDAD.MAYOR.READ',
  'REPORTERIA.CONTABILIDAD.ESTADO_RESULTADOS.READ',
  'REPORTERIA.CONTABILIDAD.BALANCE_GENERAL.READ',
  'REPORTERIA.CONTABILIDAD.FLUJO_CAJA.READ',
  'CONTABILIDAD.LIBRO_DIARIO.READ',
  'CONTABILIDAD.LIBRO_MAYOR.READ',
  'CONTABILIDAD.EEFF.READ',
  'CONTABILIDAD.ESTADO_RESULTADOS.READ',
  'CONTABILIDAD.BALANCE_GENERAL.READ',
  'CONTABILIDAD.FLUJO_CAJA.READ'
])
WHERE r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL', 'CONTADOR_GENERAL', 'CONTADOR', 'REPORTERIA_CONTABLE')
ON CONFLICT (id_rol, id_permiso) DO UPDATE SET
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.rol_permiso.version_registro, 1) + 1;

-- Usuarios contables reales ya sembrados reciben el rol específico como respaldo.
-- No reemplaza sus roles existentes; solo garantiza que el panel de reportería contable sea visible.
INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro, id_usuario_creador)
SELECT u.id_persona, r.id_rol, 'Activo', NULL
FROM persona.persona_usuario u
JOIN seguridad.rol r ON r.codigo = 'REPORTERIA_CONTABLE'
WHERE LOWER(u.nombre_usuario) IN ('maria.contador')
   OR UPPER(COALESCE(u.tipo_usuario, '')) IN ('CONTADOR', 'CONTADOR_GENERAL')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.usuario_rol.version_registro, 1) + 1;

SELECT setval(pg_get_serial_sequence('seguridad.permiso', 'id_permiso'), COALESCE((SELECT MAX(id_permiso) FROM seguridad.permiso), 1), true);
SELECT setval(pg_get_serial_sequence('seguridad.rol', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM seguridad.rol), 1), true);
