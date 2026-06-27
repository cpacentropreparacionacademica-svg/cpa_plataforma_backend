-- 010_seed_plan_cuentas_cpa_estandarizado.sql
-- Propósito:
--   1) Normalizar el plan de cuentas activo de CPA según el Excel ESTADOS FINANCIEROS.xlsx.
--   2) Mantener solo cuentas reales usadas por la operación actual y las mínimas necesarias del sistema.
--   3) Evitar tocar migraciones ya aplicadas para no romper checksums en Render.
--   4) Endurecer la gestión de permisos para que un administrador no se quite acceso a sí mismo.

BEGIN;

-- 1. Grupos contables estándar.
WITH source(codigo, nombre, parent_codigo, tipo, sub_tipo, sub_grupo, orden_reporte) AS (
  VALUES
  ('1', 'ACTIVO', NULL, 'BALANCE', 'ACTIVO', NULL, 1),
  ('1.1', 'Activo corriente', '1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 2),
  ('1.1.01', 'Disponible: caja, bancos y QR', '1.1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 3),
  ('1.1.03', 'Cuentas por cobrar estudiantes y clientes', '1.1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 4),
  ('1.1.07', 'Créditos fiscales e impuestos por recuperar', '1.1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 5),
  ('1.1.08', 'Inventario de materiales educativos', '1.1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 6),
  ('1.2', 'Activo no corriente', '1', 'BALANCE', 'ACTIVO', 'NO_CORRIENTE', 7),
  ('1.2.01', 'Propiedad, planta y equipo', '1.2', 'BALANCE', 'ACTIVO', 'NO_CORRIENTE', 8),
  ('1.2.02', 'Depreciación acumulada de activos fijos', '1.2', 'BALANCE', 'ACTIVO', 'NO_CORRIENTE', 9),
  ('2', 'PASIVO', NULL, 'BALANCE', 'PASIVO', NULL, 10),
  ('2.1', 'Pasivo corriente', '2', 'BALANCE', 'PASIVO', 'CORRIENTE', 11),
  ('2.1.02', 'Cuentas por pagar proveedores', '2.1', 'BALANCE', 'PASIVO', 'CORRIENTE', 12),
  ('2.1.03', 'Cuentas por pagar tutores y docentes', '2.1', 'BALANCE', 'PASIVO', 'CORRIENTE', 13),
  ('2.1.04', 'Remuneraciones y beneficios por pagar', '2.1', 'BALANCE', 'PASIVO', 'CORRIENTE', 14),
  ('2.1.05', 'Tributos por pagar', '2.1', 'BALANCE', 'PASIVO', 'CORRIENTE', 15),
  ('2.1.06', 'Ingresos diferidos y paquetes cobrados por anticipado', '2.1', 'BALANCE', 'PASIVO', 'CORRIENTE', 16),
  ('2.2', 'Pasivo no corriente', '2', 'BALANCE', 'PASIVO', 'NO_CORRIENTE', 17),
  ('2.2.01', 'Préstamos bancarios de largo plazo', '2.2', 'BALANCE', 'PASIVO', 'NO_CORRIENTE', 18),
  ('3', 'PATRIMONIO', NULL, 'BALANCE', 'PATRIMONIO', NULL, 19),
  ('3.1', 'Capital y aportes de propietario', '3', 'BALANCE', 'PATRIMONIO', NULL, 20),
  ('3.4', 'Resultados acumulados', '3', 'BALANCE', 'PATRIMONIO', NULL, 21),
  ('3.5', 'Resultado de la gestión', '3', 'BALANCE', 'PATRIMONIO', NULL, 22),
  ('4', 'INGRESOS', NULL, 'RESULTADOS', 'INGRESO', NULL, 23),
  ('4.1', 'Ingresos operativos educativos', '4', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 24),
  ('4.1.01', 'Ingresos por clases', '4.1', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 25),
  ('4.1.02', 'Ingresos por becas y preparación de exámenes', '4.1', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 26),
  ('4.1.03', 'Ingresos por paquetes educativos', '4.1', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 27),
  ('4.1.04', 'Ingresos por nivelación', '4.1', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 28),
  ('4.2', 'Otros ingresos', '4', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 29),
  ('4.2.01', 'Intereses ganados', '4.2', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 30),
  ('4.2.02', 'Otros ingresos varios', '4.2', 'RESULTADOS', 'INGRESO', 'ORDINARIO', 31),
  ('5', 'EGRESOS', NULL, 'RESULTADOS', 'GASTO', NULL, 32),
  ('5.1', 'Honorarios y costos educativos', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 33),
  ('5.2', 'Gastos administrativos y laborales', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 34),
  ('5.3', 'Materiales, servicios básicos y mantenimiento', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 35),
  ('5.4', 'Depreciaciones', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 36),
  ('5.5', 'Gastos financieros y diferencia de cambio', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 37),
  ('5.6', 'Otros gastos', '5', 'RESULTADOS', 'GASTO', 'ORDINARIO', 38)
), upserted AS (
  INSERT INTO contabilidad.grupo_cuenta (codigo, nombre, id_parent, tipo, sub_tipo, sub_grupo, orden_reporte, estado_registro)
  SELECT s.codigo,
         s.nombre,
         parent.id_grupo_cuenta,
         s.tipo,
         s.sub_tipo,
         s.sub_grupo,
         s.orden_reporte,
         'Activo'
  FROM source s
  LEFT JOIN contabilidad.grupo_cuenta parent ON parent.codigo = s.parent_codigo
  ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    id_parent = EXCLUDED.id_parent,
    tipo = EXCLUDED.tipo,
    sub_tipo = EXCLUDED.sub_tipo,
    sub_grupo = EXCLUDED.sub_grupo,
    orden_reporte = EXCLUDED.orden_reporte,
    estado_registro = 'Activo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(contabilidad.grupo_cuenta.version_registro, 1) + 1
  RETURNING codigo
)
UPDATE contabilidad.grupo_cuenta gc
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(gc.version_registro, 1) + 1
WHERE gc.codigo NOT IN ('1', '1.1', '1.1.01', '1.1.03', '1.1.07', '1.1.08', '1.2', '1.2.01', '1.2.02', '2', '2.1', '2.1.02', '2.1.03', '2.1.04', '2.1.05', '2.1.06', '2.2', '2.2.01', '3', '3.1', '3.4', '3.5', '4', '4.1', '4.1.01', '4.1.02', '4.1.03', '4.1.04', '4.2', '4.2.01', '4.2.02', '5', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6')
  AND COALESCE(gc.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo');

-- 2. Cuentas contables reales del Excel + cuentas mínimas requeridas por el backend.
WITH source(codigo, nombre_cuenta, codigo_grupo) AS (
  VALUES
  ('1.1.01.001', 'Caja moneda nacional', '1.1.01'),
  ('1.1.01.002', 'Caja moneda extranjera', '1.1.01'),
  ('1.1.01.003', 'Banco Económico', '1.1.01'),
  ('1.1.01.013', 'Cobros QR y pagos móviles', '1.1.01'),
  ('1.1.03.001', 'Cuentas por cobrar estudiantes y clientes', '1.1.03'),
  ('1.1.07.001', 'IVA crédito fiscal', '1.1.07'),
  ('1.1.08.001', 'Materiales educativos e inventario', '1.1.08'),
  ('1.2.01.001', 'Edificio', '1.2.01'),
  ('1.2.01.002', 'Mesas', '1.2.01'),
  ('1.2.01.003', 'Sillas', '1.2.01'),
  ('1.2.01.004', 'Pizarras', '1.2.01'),
  ('1.2.01.005', 'Estantes', '1.2.01'),
  ('1.2.01.006', 'Puertas y mamparas', '1.2.01'),
  ('1.2.01.007', 'Aires acondicionados', '1.2.01'),
  ('1.2.01.008', 'Bebedero', '1.2.01'),
  ('1.2.01.009', 'Tablets y equipo de oficina', '1.2.01'),
  ('1.2.01.010', 'Impresoras y equipo de computación', '1.2.01'),
  ('1.2.02.001', 'Depreciación acumulada edificio', '1.2.02'),
  ('1.2.02.002', 'Depreciación acumulada muebles y enseres', '1.2.02'),
  ('1.2.02.003', 'Depreciación acumulada equipo de oficina', '1.2.02'),
  ('1.2.02.004', 'Depreciación acumulada equipo de computación', '1.2.02'),
  ('2.1.02.001', 'Cuentas por pagar proveedores', '2.1.02'),
  ('2.1.03.001', 'Cuentas por pagar tutores y docentes', '2.1.03'),
  ('2.1.04.001', 'Sueldos y salarios por pagar', '2.1.04'),
  ('2.1.04.002', 'Provisión para aguinaldo', '2.1.04'),
  ('2.1.05.001', 'IVA débito fiscal', '2.1.05'),
  ('2.1.05.002', 'IT e IUE por pagar', '2.1.05'),
  ('2.1.06.001', 'Paquetes cobrados por anticipado', '2.1.06'),
  ('2.2.01.001', 'Préstamo Banco Económico', '2.2.01'),
  ('2.2.01.002', 'Amortización préstamo Banco Económico', '2.2.01'),
  ('3.1.001', 'Capital Katia Caballero Ardaya', '3.1'),
  ('3.4.001', 'Utilidad o pérdida de meses anteriores', '3.4'),
  ('3.5.001', 'Utilidad o pérdida de la gestión', '3.5'),
  ('4.1.01.001', 'Ingresos por clases', '4.1.01'),
  ('4.1.02.001', 'Ingresos por becas y preparación', '4.1.02'),
  ('4.1.03.001', 'Ingresos por paquetes', '4.1.03'),
  ('4.1.04.001', 'Ingresos por nivelación', '4.1.04'),
  ('4.2.01.001', 'Intereses ganados', '4.2.01'),
  ('4.2.02.001', 'Otros ingresos', '4.2.02'),
  ('5.1.001', 'Honorarios tutores y docentes', '5.1'),
  ('5.2.001', 'Sueldos y salarios', '5.2'),
  ('5.2.002', 'Aguinaldo', '5.2'),
  ('5.3.001', 'Material de escritorio', '5.3'),
  ('5.3.002', 'Fotocopias', '5.3'),
  ('5.3.003', 'Material de limpieza', '5.3'),
  ('5.3.004', 'Servicio de té y refrigerio', '5.3'),
  ('5.3.005', 'Servicio de energía eléctrica', '5.3'),
  ('5.3.006', 'Servicio básico de internet', '5.3'),
  ('5.3.007', 'Transporte', '5.3'),
  ('5.3.008', 'Material eléctrico', '5.3'),
  ('5.3.009', 'Mantenimiento edificio', '5.3'),
  ('5.4.001', 'Depreciación edificio', '5.4'),
  ('5.4.002', 'Depreciación muebles y enseres', '5.4'),
  ('5.4.003', 'Depreciación equipo de oficina', '5.4'),
  ('5.4.004', 'Depreciación equipo de computación', '5.4'),
  ('5.5.001', 'Intereses pagados', '5.5'),
  ('5.5.002', 'Diferencia de cambio', '5.5'),
  ('5.6.001', 'Donaciones', '5.6'),
  ('5.6.002', 'Gastos varios', '5.6')
), upserted AS (
  INSERT INTO contabilidad.cuenta (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro)
  SELECT s.codigo,
         s.nombre_cuenta,
         gc.id_grupo_cuenta,
         'Activo'
  FROM source s
  JOIN contabilidad.grupo_cuenta gc ON gc.codigo = s.codigo_grupo
  ON CONFLICT (codigo) DO UPDATE SET
    nombre_cuenta = EXCLUDED.nombre_cuenta,
    id_grupo_cuenta = EXCLUDED.id_grupo_cuenta,
    estado_registro = 'Activo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(contabilidad.cuenta.version_registro, 1) + 1
  RETURNING codigo
)
UPDATE contabilidad.cuenta c
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(c.version_registro, 1) + 1
WHERE c.codigo NOT IN ('1.1.01.001', '1.1.01.002', '1.1.01.003', '1.1.01.013', '1.1.03.001', '1.1.07.001', '1.1.08.001', '1.2.01.001', '1.2.01.002', '1.2.01.003', '1.2.01.004', '1.2.01.005', '1.2.01.006', '1.2.01.007', '1.2.01.008', '1.2.01.009', '1.2.01.010', '1.2.02.001', '1.2.02.002', '1.2.02.003', '1.2.02.004', '2.1.02.001', '2.1.03.001', '2.1.04.001', '2.1.04.002', '2.1.05.001', '2.1.05.002', '2.1.06.001', '2.2.01.001', '2.2.01.002', '3.1.001', '3.4.001', '3.5.001', '4.1.01.001', '4.1.02.001', '4.1.03.001', '4.1.04.001', '4.2.01.001', '4.2.02.001', '5.1.001', '5.2.001', '5.2.002', '5.3.001', '5.3.002', '5.3.003', '5.3.004', '5.3.005', '5.3.006', '5.3.007', '5.3.008', '5.3.009', '5.4.001', '5.4.002', '5.4.003', '5.4.004', '5.5.001', '5.5.002', '5.6.001', '5.6.002')
  -- Mantener cuentas personales generadas dinámicamente por estudiante/tutor.
  AND c.codigo NOT LIKE '1.1.03.E%'
  AND c.codigo NOT LIKE '2.1.06.E%'
  AND c.codigo NOT LIKE '2.1.03.T%'
  AND COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo');

-- 3. Configuración operativa usada por venta-clase y asientos automáticos.
INSERT INTO contabilidad.configuracion_cuenta_operativa (codigo, nombre, descripcion, id_cuenta)
SELECT cfg.codigo, cfg.nombre, cfg.descripcion, c.id_cuenta
FROM (VALUES
  ('CANAL_COBRO_EFECTIVO', 'Cuenta de cobro en efectivo', 'Cuenta usada por defecto para cobros en efectivo.', '1.1.01.001'),
  ('CANAL_COBRO_QR', 'Cuenta de cobro por QR', 'Cuenta usada por defecto para cobros QR o pagos móviles.', '1.1.01.013'),
  ('IVA_DEBITO_FISCAL', 'IVA débito fiscal', 'Cuenta usada si una venta incluye impuesto.', '2.1.05.001'),
  ('INGRESO_CLASE_POR_HORA', 'Ingreso por clases', 'Cuenta de ingreso usada por defecto para clases por hora.', '4.1.01.001')
) AS cfg(codigo, nombre, descripcion, codigo_cuenta)
JOIN contabilidad.cuenta c ON c.codigo = cfg.codigo_cuenta
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  id_cuenta = EXCLUDED.id_cuenta,
  es_obligatoria = true,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(contabilidad.configuracion_cuenta_operativa.version_registro, 1) + 1;

-- 4. Centros de costo compactos y útiles para operación real.
WITH source(codigo, nombre, codigo_ingreso, codigo_costo, observaciones) AS (
  VALUES
  ('EDU-CLASES', 'Clases', '4.1.01.001', '5.1.001', 'Centro de costo para clases por hora y sesiones educativas.'),
  ('EDU-BECAS', 'Becas y preparación de exámenes', '4.1.02.001', '5.1.001', 'Centro de costo para intensivos, becas y preparación académica.'),
  ('EDU-PAQUETES', 'Paquetes educativos', '4.1.03.001', '5.1.001', 'Centro de costo para paquetes educativos cobrados por anticipado.'),
  ('EDU-NIVELACION', 'Nivelación', '4.1.04.001', '5.1.001', 'Centro de costo para nivelación escolar o universitaria.'),
  ('ADM-GRAL', 'Administración general', NULL, '5.2.001', 'Centro de costo administrativo base.'),
  ('INFRA-MANT', 'Infraestructura y mantenimiento', NULL, '5.3.009', 'Centro de costo para mantenimiento de edificio y activos.')
)
INSERT INTO contabilidad.centro_costo (codigo, nombre, id_cuenta_ingreso, id_cuenta_costo, observaciones, estado_registro)
SELECT s.codigo,
       s.nombre,
       ci.id_cuenta,
       cc.id_cuenta,
       s.observaciones,
       'Activo'
FROM source s
LEFT JOIN contabilidad.cuenta ci ON ci.codigo = s.codigo_ingreso
LEFT JOIN contabilidad.cuenta cc ON cc.codigo = s.codigo_costo
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  id_cuenta_ingreso = EXCLUDED.id_cuenta_ingreso,
  id_cuenta_costo = EXCLUDED.id_cuenta_costo,
  observaciones = EXCLUDED.observaciones,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(contabilidad.centro_costo.version_registro, 1) + 1;

UPDATE contabilidad.centro_costo cc
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(cc.version_registro, 1) + 1
WHERE cc.codigo NOT IN ('EDU-CLASES', 'EDU-BECAS', 'EDU-PAQUETES', 'EDU-NIVELACION', 'ADM-GRAL', 'INFRA-MANT')
  AND COALESCE(cc.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo');

-- 5. Conceptos de costo mínimos para importaciones, costos y reportes.
WITH source(codigo, nombre, tipo_concepto, unidad_medida) AS (
  VALUES
  ('DOC-HORA', 'Hora tutor/docente', 'SERVICIO', 'hora'),
  ('DOC-CURSO', 'Honorario docente curso o beca', 'SERVICIO', 'sesion'),
  ('MAT-ESC', 'Material de escritorio', 'BIEN', 'unidad'),
  ('MAT-LIMP', 'Material de limpieza', 'BIEN', 'unidad'),
  ('FOT-COP', 'Fotocopias', 'SERVICIO', 'copia'),
  ('SERV-INT', 'Servicio de internet', 'SERVICIO', 'mes'),
  ('SERV-LUZ', 'Servicio de energía eléctrica', 'SERVICIO', 'mes'),
  ('MANT-EDI', 'Mantenimiento de edificio', 'SERVICIO', 'trabajo')
)
INSERT INTO contabilidad.concepto_costo (codigo, nombre, tipo_concepto, unidad_medida, estado_registro)
SELECT codigo, nombre, tipo_concepto, unidad_medida, 'Activo'
FROM source
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo_concepto = EXCLUDED.tipo_concepto,
  unidad_medida = EXCLUDED.unidad_medida,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(contabilidad.concepto_costo.version_registro, 1) + 1;

UPDATE contabilidad.concepto_costo c
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(c.version_registro, 1) + 1
WHERE c.codigo NOT IN ('DOC-HORA', 'DOC-CURSO', 'MAT-ESC', 'MAT-LIMP', 'FOT-COP', 'SERV-INT', 'SERV-LUZ', 'MANT-EDI')
  AND COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo');

-- 6. Permisos críticos explícitos para administración de seguridad.
INSERT INTO seguridad.permiso (codigo, descripcion, modulo)
VALUES
  ('SISTEMA.PERMISOS.VER', 'Ver permisos, roles y asignaciones de seguridad', 'SISTEMA'),
  ('SISTEMA.PERMISOS.GESTIONAR', 'Crear o modificar permisos y asignaciones de seguridad', 'SISTEMA'),
  ('SISTEMA.ROLES.VER', 'Ver roles del sistema', 'SISTEMA'),
  ('SISTEMA.ROLES.GESTIONAR', 'Crear o modificar roles del sistema', 'SISTEMA'),
  ('SISTEMA.USUARIOS.ASIGNAR_ROL', 'Asignar o modificar roles de usuarios', 'SISTEMA'),
  ('PERSONAS.PERSONA.CREATE', 'Crear personas base desde API', 'PERSONAS'),
  ('PERSONAS.PERSONA.READ', 'Ver personas base desde API', 'PERSONAS'),
  ('PERSONAS.PERSONA.UPDATE', 'Modificar nombres, apellidos, teléfono y datos base de personas', 'PERSONAS')
ON CONFLICT (codigo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.permiso.version_registro, 1) + 1;

-- Solo administradores reciben permisos de seguridad crítica. Contadores no los reciben.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY[
  'SISTEMA.PERMISOS.VER',
  'SISTEMA.PERMISOS.GESTIONAR',
  'SISTEMA.ROLES.VER',
  'SISTEMA.ROLES.GESTIONAR',
  'SISTEMA.USUARIOS.ASIGNAR_ROL',
  'PERSONAS.PERSONA.CREATE',
  'PERSONAS.PERSONA.READ',
  'PERSONAS.PERSONA.UPDATE'
])
WHERE r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- Contador puede consultar personas base para reportes, pero no modificar permisos.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo IN ('PERSONAS.PERSONA.READ')
WHERE r.codigo IN ('CONTADOR', 'CONTADOR_GENERAL')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- Refuerzo: contador puede leer contabilidad, no administrar permisos ni roles.
DELETE FROM seguridad.rol_permiso rp
USING seguridad.rol r, seguridad.permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.codigo IN ('CONTADOR', 'CONTADOR_GENERAL')
  AND p.codigo IN ('SISTEMA.PERMISOS.GESTIONAR', 'SISTEMA.ROLES.GESTIONAR', 'SISTEMA.USUARIOS.ASIGNAR_ROL');

-- 7. Usuario base sin textos de prueba y con nombres actualizables vía persona/personas.
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

-- 8. Función de DB para reemplazo completo de permisos de rol con autoprotección.
CREATE OR REPLACE FUNCTION seguridad.api_set_permisos_rol(p_id_sesion bigint, p_id_rol bigint, p_permisos text[]) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_id_actor bigint;
  v_codes text[];
  v_count integer := 0;
  v_actor_has_role boolean := false;
  v_actor_is_super boolean := false;
  v_required_codes text[] := ARRAY['SISTEMA.PERMISOS.GESTIONAR', 'SISTEMA.ROLES.GESTIONAR', 'SISTEMA.USUARIOS.ASIGNAR_ROL'];
  v_missing_self_codes text[];
BEGIN
  v_id_actor := seguridad.fn_guard_permiso_api(p_id_sesion, 'SISTEMA.ROLES.GESTIONAR', 'ROL_SET_PERMISOS');

  SELECT COALESCE(es_super_usuario, false)
    INTO v_actor_is_super
  FROM persona.persona_usuario
  WHERE id_persona = v_id_actor;

  SELECT EXISTS (
    SELECT 1
    FROM seguridad.usuario_rol ur
    WHERE ur.id_persona = v_id_actor
      AND ur.id_rol = p_id_rol
      AND COALESCE(ur.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  ) INTO v_actor_has_role;

  SELECT COALESCE(array_agg(DISTINCT upper(btrim(x))), ARRAY[]::text[])
    INTO v_codes
  FROM unnest(COALESCE(p_permisos, ARRAY[]::text[])) x
  WHERE btrim(COALESCE(x,'')) <> '';

  IF v_actor_has_role THEN
    SELECT COALESCE(array_agg(code), ARRAY[]::text[])
      INTO v_missing_self_codes
    FROM unnest(v_required_codes) code
    WHERE NOT code = ANY(v_codes);

    IF array_length(v_missing_self_codes, 1) IS NOT NULL AND array_length(v_missing_self_codes, 1) > 0 THEN
      RAISE EXCEPTION 'No puedes quitarte permisos críticos a ti mismo. Permisos requeridos: %', array_to_string(v_required_codes, ', ')
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  DELETE FROM seguridad.rol_permiso WHERE id_rol = p_id_rol;

  IF array_length(v_codes, 1) IS NOT NULL AND array_length(v_codes, 1) > 0 THEN
    INSERT INTO seguridad.rol_permiso (id_rol, id_permiso, id_usuario_creador)
    SELECT p_id_rol, p.id_permiso, v_id_actor
    FROM seguridad.permiso p
    WHERE p.codigo = ANY(v_codes)
      AND p.estado_registro = 'Activo'
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  PERFORM seguridad.fn_log_action(
    p_id_sesion,'ROL_SET_PERMISOS','SECURITY','seguridad','rol_permiso',
    jsonb_build_object('id_rol', p_id_rol), TRUE,
    jsonb_build_object('count', v_count, 'id_actor', v_id_actor)
  );

  RETURN seguridad.fn_api_result(TRUE, 'Permisos actualizados', jsonb_build_object('id_rol', p_id_rol, 'permisos', v_codes));
EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN seguridad.fn_api_result(FALSE, SQLERRM, NULL);
  WHEN OTHERS THEN
    PERFORM seguridad.fn_log_action(
      p_id_sesion,'ROL_SET_PERMISOS','ERROR','seguridad','rol_permiso',
      jsonb_build_object('id_rol', p_id_rol), FALSE,
      jsonb_build_object('sqlstate',SQLSTATE,'error',SQLERRM,'id_actor',v_id_actor)
    );
    RETURN seguridad.fn_api_result(FALSE, SQLERRM, NULL);
END;
$$;

SELECT setval(pg_get_serial_sequence('contabilidad.grupo_cuenta', 'id_grupo_cuenta'), COALESCE((SELECT MAX(id_grupo_cuenta) FROM contabilidad.grupo_cuenta), 1), true);
SELECT setval(pg_get_serial_sequence('contabilidad.cuenta', 'id_cuenta'), COALESCE((SELECT MAX(id_cuenta) FROM contabilidad.cuenta), 1), true);
SELECT setval(pg_get_serial_sequence('contabilidad.centro_costo', 'id_centro_costo'), COALESCE((SELECT MAX(id_centro_costo) FROM contabilidad.centro_costo), 1), true);
SELECT setval(pg_get_serial_sequence('contabilidad.concepto_costo', 'id_concepto'), COALESCE((SELECT MAX(id_concepto) FROM contabilidad.concepto_costo), 1), true);
SELECT setval(pg_get_serial_sequence('seguridad.permiso', 'id_permiso'), COALESCE((SELECT MAX(id_permiso) FROM seguridad.permiso), 1), true);
SELECT setval(pg_get_serial_sequence('seguridad.rol', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM seguridad.rol), 1), true);
SELECT setval(pg_get_serial_sequence('persona.persona', 'id_persona'), COALESCE((SELECT MAX(id_persona) FROM persona.persona), 1), true);

COMMIT;
