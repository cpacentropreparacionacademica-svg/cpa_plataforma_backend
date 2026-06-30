-- 011_patch_venta_clase_sin_fiscal_apertura_lifecycle.sql
-- Propósito:
--   1) Quitar IVA/crédito fiscal del flujo automático de parte de clases pasadas.
--   2) Asegurar trazabilidad comercial: transaccion + movimientos + transaccion_venta + detalle + registro.
--   3) Mejorar grupos exigibles/CxC y seedear balance de apertura Mayo 2026.
--   4) Agregar permisos para endpoints transaccionales de creación no fragmentada.

BEGIN;

-- 1. Detalle de venta: permitir recargos explícitos/inferidos y calcular total sin fiscal para venta-clase.
ALTER TABLE contabilidad.transaccion_detalle_venta
  ADD COLUMN IF NOT EXISTS monto_recargo numeric(18,6) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_transaccion_detalle_venta_recargo'
      AND conrelid = 'contabilidad.transaccion_detalle_venta'::regclass
  ) THEN
    ALTER TABLE contabilidad.transaccion_detalle_venta
      ADD CONSTRAINT ck_transaccion_detalle_venta_recargo CHECK (monto_recargo >= 0);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION contabilidad.fn_calcular_transaccion_detalle_venta_totales()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  bruto numeric(18,6);
  descuento_porcentaje numeric(18,6);
  descuento_final numeric(18,6);
  recargo_final numeric(18,6);
  subtotal_final numeric(18,6);
  impuesto_final numeric(18,6);
BEGIN
  bruto := COALESCE(NEW.cantidad, 0) * COALESCE(NEW.precio_unitario, 0);
  descuento_porcentaje := bruto * COALESCE(NEW.porcentaje_descuento, 0) / 100;
  descuento_final := GREATEST(COALESCE(NEW.monto_descuento, 0), descuento_porcentaje);
  recargo_final := GREATEST(COALESCE(NEW.monto_recargo, 0), 0);
  subtotal_final := GREATEST(bruto - descuento_final + recargo_final, 0);

  IF COALESCE(NEW.monto_impuesto, 0) > 0 THEN
    impuesto_final := COALESCE(NEW.monto_impuesto, 0);
  ELSE
    impuesto_final := subtotal_final * COALESCE(NEW.porcentaje_impuesto, 0) / 100;
  END IF;

  NEW.monto_descuento := descuento_final;
  NEW.monto_recargo := recargo_final;
  NEW.monto_subtotal := subtotal_final;
  NEW.monto_impuesto := impuesto_final;
  NEW.monto_total := subtotal_final + impuesto_final;

  RETURN NEW;
END;
$$;

-- 2. Cabecera comercial de venta: una fila por transacción de venta.
CREATE TABLE IF NOT EXISTS contabilidad.transaccion_venta (
    id_transaccion bigint PRIMARY KEY,
    fecha_venta date NOT NULL,
    id_cliente bigint,
    id_producto_educativo bigint,
    id_producto_tienda bigint,
    id_curso_version bigint,
    id_clase_por_hora bigint,
    id_tienda bigint,
    id_sucursal bigint,
    cantidad_total numeric(18,6) NOT NULL DEFAULT 0,
    precio_unitario_referencia numeric(18,6) NOT NULL DEFAULT 0,
    monto_subtotal numeric(18,6) NOT NULL DEFAULT 0,
    monto_descuento numeric(18,6) NOT NULL DEFAULT 0,
    monto_recargo numeric(18,6) NOT NULL DEFAULT 0,
    monto_impuesto numeric(18,6) NOT NULL DEFAULT 0,
    monto_total numeric(18,6) NOT NULL DEFAULT 0,
    moneda character varying(3) NOT NULL DEFAULT 'BOB',
    monto_efectivo numeric(18,6) NOT NULL DEFAULT 0,
    monto_qr numeric(18,6) NOT NULL DEFAULT 0,
    monto_cxc numeric(18,6) NOT NULL DEFAULT 0,
    monto_paquete numeric(18,6) NOT NULL DEFAULT 0,
    observaciones text,
    estado_registro character varying(20) DEFAULT 'Activo'::character varying,
    fecha_registro timestamp with time zone DEFAULT now(),
    fecha_modificacion timestamp with time zone,
    version_registro integer DEFAULT 1,
    id_usuario_creador bigint,
    id_usuario_modificacion bigint,
    CONSTRAINT ck_transaccion_venta_cantidad CHECK (cantidad_total >= 0),
    CONSTRAINT ck_transaccion_venta_montos CHECK (
      precio_unitario_referencia >= 0
      AND monto_subtotal >= 0
      AND monto_descuento >= 0
      AND monto_recargo >= 0
      AND monto_impuesto >= 0
      AND monto_total >= 0
      AND monto_efectivo >= 0
      AND monto_qr >= 0
      AND monto_cxc >= 0
      AND monto_paquete >= 0
    )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_transaccion_venta_referencia'
      AND conrelid = 'contabilidad.transaccion_venta'::regclass
  ) THEN
    ALTER TABLE contabilidad.transaccion_venta
      ADD CONSTRAINT ck_transaccion_venta_referencia CHECK (
        id_producto_educativo IS NOT NULL
        OR id_producto_tienda IS NOT NULL
        OR id_curso_version IS NOT NULL
        OR id_clase_por_hora IS NOT NULL
      );
  END IF;
END;
$$;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT unnest(ARRAY[
      'transaccion_venta_id_transaccion_fkey',
      'transaccion_venta_id_cliente_fkey',
      'transaccion_venta_id_producto_educativo_fkey',
      'transaccion_venta_id_producto_tienda_fkey',
      'transaccion_venta_id_curso_version_fkey',
      'transaccion_venta_id_clase_por_hora_fkey',
      'transaccion_venta_id_tienda_fkey',
      'transaccion_venta_id_sucursal_fkey'
    ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = constraint_name
        AND conrelid = 'contabilidad.transaccion_venta'::regclass
    ) THEN
      EXECUTE format('ALTER TABLE contabilidad.transaccion_venta DROP CONSTRAINT %I', constraint_name);
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_transaccion_fkey
  FOREIGN KEY (id_transaccion) REFERENCES contabilidad.transaccion(id_transaccion) ON DELETE CASCADE;
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_cliente_fkey
  FOREIGN KEY (id_cliente) REFERENCES persona.persona(id_persona);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_producto_educativo_fkey
  FOREIGN KEY (id_producto_educativo) REFERENCES servicios_educativos.producto_educativo(id_producto_educativo);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_producto_tienda_fkey
  FOREIGN KEY (id_producto_tienda) REFERENCES inventario.bien(id_bien);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_curso_version_fkey
  FOREIGN KEY (id_curso_version) REFERENCES servicios_educativos.curso_version(id_curso_version);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_clase_por_hora_fkey
  FOREIGN KEY (id_clase_por_hora) REFERENCES servicios_educativos.clase_por_hora(id_clase);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_tienda_fkey
  FOREIGN KEY (id_tienda) REFERENCES infraestructura.tienda(id_tienda);
ALTER TABLE contabilidad.transaccion_venta
  ADD CONSTRAINT transaccion_venta_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES infraestructura.sucursal(id_sucursal);

CREATE INDEX IF NOT EXISTS ix_transaccion_venta_fecha ON contabilidad.transaccion_venta (fecha_venta);
CREATE INDEX IF NOT EXISTS ix_transaccion_venta_cliente ON contabilidad.transaccion_venta (id_cliente);
CREATE INDEX IF NOT EXISTS ix_transaccion_venta_producto_educativo ON contabilidad.transaccion_venta (id_producto_educativo);
CREATE INDEX IF NOT EXISTS ix_transaccion_venta_producto_tienda ON contabilidad.transaccion_venta (id_producto_tienda);
CREATE INDEX IF NOT EXISTS ix_transaccion_venta_clase ON contabilidad.transaccion_venta (id_clase_por_hora);
CREATE INDEX IF NOT EXISTS ix_transaccion_venta_estado ON contabilidad.transaccion_venta (estado_registro);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'bu_transaccion_venta'
      AND tgrelid = 'contabilidad.transaccion_venta'::regclass
  ) THEN
    CREATE TRIGGER bu_transaccion_venta
      BEFORE UPDATE ON contabilidad.transaccion_venta
      FOR EACH ROW EXECUTE FUNCTION contabilidad.fn_audit_bu_simple();
  END IF;
END;
$$;

CREATE OR REPLACE VIEW contabilidad.v_transaccion_venta AS
SELECT
  tv.*,
  t.tipo_transaccion,
  t.sub_tipo_transaccion,
  t.glosa AS transaccion_glosa,
  pe.nombre AS producto_educativo_nombre,
  b.nombre AS producto_tienda_nombre,
  cli.nombres AS cliente_nombres,
  cli.apellidos AS cliente_apellidos,
  cv.nombre_version AS curso_version_nombre
FROM contabilidad.transaccion_venta tv
JOIN contabilidad.transaccion t ON t.id_transaccion = tv.id_transaccion
LEFT JOIN servicios_educativos.producto_educativo pe ON pe.id_producto_educativo = tv.id_producto_educativo
LEFT JOIN inventario.bien b ON b.id_bien = tv.id_producto_tienda
LEFT JOIN persona.persona cli ON cli.id_persona = tv.id_cliente
LEFT JOIN servicios_educativos.curso_version cv ON cv.id_curso_version = tv.id_curso_version
WHERE COALESCE(tv.estado_registro, 'Activo') = 'Activo';

ALTER TABLE contabilidad.venta_clase_registro
  ADD COLUMN IF NOT EXISTS id_transaccion_venta bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venta_clase_registro_id_transaccion_venta_fkey'
      AND conrelid = 'contabilidad.venta_clase_registro'::regclass
  ) THEN
    ALTER TABLE contabilidad.venta_clase_registro
      ADD CONSTRAINT venta_clase_registro_id_transaccion_venta_fkey
      FOREIGN KEY (id_transaccion_venta) REFERENCES contabilidad.transaccion_venta(id_transaccion) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS ix_venta_clase_registro_transaccion_venta
  ON contabilidad.venta_clase_registro (id_transaccion_venta);

-- PostgreSQL no permite que CREATE OR REPLACE VIEW cambie el nombre/orden
-- de columnas existentes. Como esta migración agrega id_transaccion_venta a
-- venta_clase_registro y la vista anterior usaba vcr.*, se debe recrear la
-- vista para evitar el error:
-- cannot change name of view column "estudiante_nombre_completo" to "id_transaccion_venta".
DROP VIEW IF EXISTS contabilidad.v_venta_clase_registro;

CREATE OR REPLACE VIEW contabilidad.v_venta_clase_registro AS
SELECT
  vcr.*,
  CONCAT_WS(' ', est.nombres, est.apellidos) AS estudiante_nombre_completo,
  CONCAT_WS(' ', per_tutor.nombres, per_tutor.apellidos) AS tutor_nombre_completo,
  mt.nombre AS materia_nombre,
  mt.tema AS materia_tema,
  mt.subtema AS materia_subtema,
  pe.nombre AS producto_educativo_nombre,
  cv.nombre_version AS curso_version_nombre,
  t.tipo_transaccion,
  t.glosa AS transaccion_glosa,
  tv.monto_subtotal AS venta_monto_subtotal,
  tv.monto_descuento AS venta_monto_descuento,
  tv.monto_recargo AS venta_monto_recargo,
  tv.monto_impuesto AS venta_monto_impuesto,
  tv.monto_total AS venta_monto_total,
  dv.monto_subtotal AS detalle_monto_subtotal,
  dv.monto_descuento AS detalle_monto_descuento,
  dv.monto_recargo AS detalle_monto_recargo,
  dv.monto_impuesto AS detalle_monto_impuesto,
  dv.monto_total AS detalle_monto_total
FROM contabilidad.venta_clase_registro vcr
LEFT JOIN persona.persona est ON est.id_persona = vcr.id_estudiante
LEFT JOIN persona.persona_tutor tutor ON tutor.id_tutor = vcr.id_tutor
LEFT JOIN persona.persona per_tutor ON per_tutor.id_persona = tutor.id_persona
LEFT JOIN servicios_educativos.materia_tree mt ON mt.id_tree = vcr.id_materia_tree
LEFT JOIN servicios_educativos.producto_educativo pe ON pe.id_producto_educativo = vcr.id_producto_educativo
LEFT JOIN servicios_educativos.curso_version cv ON cv.id_curso_version = vcr.id_curso_version
LEFT JOIN contabilidad.transaccion t ON t.id_transaccion = vcr.id_transaccion
LEFT JOIN contabilidad.transaccion_venta tv ON tv.id_transaccion = vcr.id_transaccion_venta
LEFT JOIN contabilidad.transaccion_detalle_venta dv ON dv.id_detalle_venta = vcr.id_detalle_venta
WHERE COALESCE(vcr.estado_registro, 'Activo') = 'Activo';

-- 3. Grupos contables exigibles/CxC. Se desactivan grupos fiscales.
WITH source(codigo, nombre, parent_codigo, tipo, sub_tipo, sub_grupo, orden_reporte) AS (
  VALUES
  ('1.1.02', 'Exigible: cuentas por cobrar', '1.1', 'BALANCE', 'ACTIVO', 'CORRIENTE', 4),
  ('1.1.02.01', 'Cuentas por cobrar clientes y estudiantes', '1.1.02', 'BALANCE', 'ACTIVO', 'CORRIENTE', 5),
  ('1.1.02.02', 'Otras cuentas por cobrar', '1.1.02', 'BALANCE', 'ACTIVO', 'CORRIENTE', 6)
)
INSERT INTO contabilidad.grupo_cuenta (codigo, nombre, id_parent, tipo, sub_tipo, sub_grupo, orden_reporte, estado_registro)
SELECT s.codigo, s.nombre, parent.id_grupo_cuenta, s.tipo, s.sub_tipo, s.sub_grupo, s.orden_reporte, 'Activo'
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
  version_registro = COALESCE(contabilidad.grupo_cuenta.version_registro, 1) + 1;

INSERT INTO contabilidad.cuenta (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro)
SELECT src.codigo, src.nombre_cuenta, gc.id_grupo_cuenta, 'Activo'
FROM (VALUES
  ('1.1.02.01.001', 'Cuentas por cobrar estudiantes y clientes', '1.1.02.01'),
  ('1.1.02.02.001', 'Otras cuentas por cobrar', '1.1.02.02')
) AS src(codigo, nombre_cuenta, codigo_grupo)
JOIN contabilidad.grupo_cuenta gc ON gc.codigo = src.codigo_grupo
ON CONFLICT (codigo) DO UPDATE SET
  nombre_cuenta = EXCLUDED.nombre_cuenta,
  id_grupo_cuenta = EXCLUDED.id_grupo_cuenta,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(contabilidad.cuenta.version_registro, 1) + 1;

-- Mantener asignaciones históricas existentes, pero moverlas al grupo exigible nuevo si aún usan el grupo antiguo.
UPDATE contabilidad.cuenta c
SET id_grupo_cuenta = gc.id_grupo_cuenta,
    fecha_modificacion = NOW(),
    version_registro = COALESCE(c.version_registro, 1) + 1
FROM contabilidad.grupo_cuenta gc
WHERE gc.codigo = '1.1.02.01'
  AND c.codigo LIKE '1.1.03.E%';

UPDATE contabilidad.cuenta c
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(c.version_registro, 1) + 1
WHERE c.codigo IN ('1.1.03.001', '1.1.07.001', '2.1.05.001', '2.1.05.002')
   OR c.codigo LIKE '1.1.07.%'
   OR c.codigo LIKE '2.1.05.%'
   OR LOWER(c.nombre_cuenta) LIKE '%crédito fiscal%'
   OR LOWER(c.nombre_cuenta) LIKE '%credito fiscal%'
   OR LOWER(c.nombre_cuenta) LIKE '%débito fiscal%'
   OR LOWER(c.nombre_cuenta) LIKE '%debito fiscal%'
   OR LOWER(c.nombre_cuenta) LIKE '%iva%'
   OR LOWER(c.nombre_cuenta) LIKE '%tribut%';

UPDATE contabilidad.grupo_cuenta gc
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(gc.version_registro, 1) + 1
WHERE gc.codigo IN ('1.1.03', '1.1.07', '2.1.05')
   OR LOWER(gc.nombre) LIKE '%crédito fiscal%'
   OR LOWER(gc.nombre) LIKE '%credito fiscal%'
   OR LOWER(gc.nombre) LIKE '%fiscal%'
   OR LOWER(gc.nombre) LIKE '%tribut%';

UPDATE contabilidad.configuracion_cuenta_operativa cfg
SET estado_registro = 'Inactivo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(cfg.version_registro, 1) + 1
WHERE cfg.codigo = 'IVA_DEBITO_FISCAL';

UPDATE contabilidad.configuracion_cuenta_operativa cfg
SET id_cuenta = c.id_cuenta,
    estado_registro = 'Activo',
    fecha_modificacion = NOW(),
    version_registro = COALESCE(cfg.version_registro, 1) + 1
FROM contabilidad.cuenta c
WHERE cfg.codigo = 'INGRESO_CLASE_POR_HORA'
  AND c.codigo = '4.1.01.001';

-- 4. Permisos para endpoints transaccionales no fragmentados y lectura de transaccion_venta.
INSERT INTO seguridad.permiso (codigo, descripcion, modulo)
VALUES
  ('PERSONAS.ESTUDIANTE.REGISTRAR', 'Registrar estudiante creando persona y tabla hija en una sola transacción', 'PERSONAS'),
  ('PERSONAS.TUTOR.REGISTRAR', 'Registrar tutor creando persona y tabla hija en una sola transacción', 'PERSONAS'),
  ('PERSONAS.USUARIO.REGISTRAR', 'Registrar usuario creando persona y usuario en una sola transacción', 'PERSONAS'),
  ('ADMINISTRACION.EMPLEADO.REGISTRAR', 'Registrar empleado creando persona y empleado en una sola transacción', 'ADMINISTRACION'),
  ('CONTABILIDAD.TRANSACCION_VENTA.READ', 'Leer cabeceras comerciales de venta', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_VENTA.CREATE', 'Crear cabeceras comerciales de venta desde procesos autorizados', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_VENTA.UPDATE', 'Actualizar cabeceras comerciales de venta desde procesos autorizados', 'CONTABILIDAD')
ON CONFLICT (codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    modulo = EXCLUDED.modulo,
    estado_registro = 'Activo';

INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY[
  'PERSONAS.ESTUDIANTE.REGISTRAR',
  'PERSONAS.TUTOR.REGISTRAR',
  'PERSONAS.USUARIO.REGISTRAR',
  'ADMINISTRACION.EMPLEADO.REGISTRAR',
  'CONTABILIDAD.TRANSACCION_VENTA.READ',
  'CONTABILIDAD.TRANSACCION_VENTA.CREATE',
  'CONTABILIDAD.TRANSACCION_VENTA.UPDATE'
])
WHERE r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = 'CONTABILIDAD.TRANSACCION_VENTA.READ'
WHERE r.codigo IN ('CONTADOR_GENERAL', 'CONTADOR')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- 5. Balance de apertura Mayo 2026 desde ESTADOS FINANCIEROS.xlsx / hoja MAY26.
DO $$
DECLARE
  v_id_transaccion bigint;
  v_missing integer;
  v_debe numeric(18,6);
  v_haber numeric(18,6);
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM (VALUES
    ('1.1.01.001'), ('1.1.01.002'), ('1.1.01.003'), ('1.1.02.01.001'),
    ('1.2.01.001'), ('1.2.01.002'), ('1.2.01.003'), ('1.2.01.004'), ('1.2.01.005'), ('1.2.01.006'), ('1.2.01.007'), ('1.2.01.008'), ('1.2.01.009'), ('1.2.01.010'),
    ('1.2.02.001'), ('1.2.02.002'), ('1.2.02.003'), ('1.2.02.004'),
    ('2.1.02.001'), ('2.1.04.002'), ('2.2.01.001'), ('2.2.01.002'),
    ('3.1.001'), ('3.4.001'), ('3.5.001')
  ) AS required(codigo)
  LEFT JOIN contabilidad.cuenta c ON c.codigo = required.codigo AND COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  WHERE c.id_cuenta IS NULL;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'No se puede seedear balance apertura MAY26: faltan % cuentas activas.', v_missing;
  END IF;

  SELECT SUM(debe), SUM(haber) INTO v_debe, v_haber
  FROM (VALUES
    ('1.1.01.001', 708.00::numeric, 0::numeric),
    ('1.1.01.002', 230970.00::numeric, 0::numeric),
    ('1.1.01.003', 972.12::numeric, 0::numeric),
    ('1.1.02.01.001', 500.60::numeric, 0::numeric),
    ('1.2.01.001', 135000.00::numeric, 0::numeric),
    ('1.2.01.002', 18060.00::numeric, 0::numeric),
    ('1.2.01.003', 10690.00::numeric, 0::numeric),
    ('1.2.01.004', 6150.00::numeric, 0::numeric),
    ('1.2.01.005', 700.00::numeric, 0::numeric),
    ('1.2.01.006', 6800.00::numeric, 0::numeric),
    ('1.2.01.007', 16700.00::numeric, 0::numeric),
    ('1.2.01.008', 1300.00::numeric, 0::numeric),
    ('1.2.01.009', 2580.00::numeric, 0::numeric),
    ('1.2.01.010', 1690.00::numeric, 0::numeric),
    ('2.2.01.002', 13874.52::numeric, 0::numeric),
    ('1.2.02.001', 0::numeric, 13500.00::numeric),
    ('1.2.02.002', 0::numeric, 14209.72::numeric),
    ('1.2.02.003', 0::numeric, 6306.69::numeric),
    ('1.2.02.004', 0::numeric, 802.79::numeric),
    ('2.1.02.001', 0::numeric, 455.00::numeric),
    ('2.1.04.002', 0::numeric, 1395.85::numeric),
    ('2.2.01.001', 0::numeric, 55000.00::numeric),
    ('3.1.001', 0::numeric, 160506.03::numeric),
    ('3.4.001', 0::numeric, 182927.20::numeric),
    ('3.5.001', 0::numeric, 11591.96::numeric)
  ) AS mov(codigo, debe, haber);

  IF ABS(COALESCE(v_debe, 0) - COALESCE(v_haber, 0)) > 0.009 THEN
    RAISE EXCEPTION 'Balance apertura MAY26 descuadrado. Debe %, haber %.', v_debe, v_haber;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM contabilidad.transaccion
    WHERE sub_tipo_transaccion = 'BALANCE_APERTURA_MAY26'
      AND COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
  ) THEN
    INSERT INTO contabilidad.transaccion (fecha_transaccion, tipo_transaccion, sub_tipo_transaccion, glosa, id_usuario_creador)
    VALUES ('2026-05-31', 'GENERAL', 'BALANCE_APERTURA_MAY26', 'Balance de apertura Mayo 2026 desde ESTADOS FINANCIEROS.xlsx hoja MAY26', 900001)
    RETURNING id_transaccion INTO v_id_transaccion;

    INSERT INTO contabilidad.transaccion_movimiento_cuenta (id_transaccion, id_cuenta, debe, haber, id_usuario_creador)
    SELECT v_id_transaccion, c.id_cuenta, mov.debe::double precision, mov.haber::double precision, 900001
    FROM (VALUES
      ('1.1.01.001', 708.00::numeric, 0::numeric),
      ('1.1.01.002', 230970.00::numeric, 0::numeric),
      ('1.1.01.003', 972.12::numeric, 0::numeric),
      ('1.1.02.01.001', 500.60::numeric, 0::numeric),
      ('1.2.01.001', 135000.00::numeric, 0::numeric),
      ('1.2.01.002', 18060.00::numeric, 0::numeric),
      ('1.2.01.003', 10690.00::numeric, 0::numeric),
      ('1.2.01.004', 6150.00::numeric, 0::numeric),
      ('1.2.01.005', 700.00::numeric, 0::numeric),
      ('1.2.01.006', 6800.00::numeric, 0::numeric),
      ('1.2.01.007', 16700.00::numeric, 0::numeric),
      ('1.2.01.008', 1300.00::numeric, 0::numeric),
      ('1.2.01.009', 2580.00::numeric, 0::numeric),
      ('1.2.01.010', 1690.00::numeric, 0::numeric),
      ('2.2.01.002', 13874.52::numeric, 0::numeric),
      ('1.2.02.001', 0::numeric, 13500.00::numeric),
      ('1.2.02.002', 0::numeric, 14209.72::numeric),
      ('1.2.02.003', 0::numeric, 6306.69::numeric),
      ('1.2.02.004', 0::numeric, 802.79::numeric),
      ('2.1.02.001', 0::numeric, 455.00::numeric),
      ('2.1.04.002', 0::numeric, 1395.85::numeric),
      ('2.2.01.001', 0::numeric, 55000.00::numeric),
      ('3.1.001', 0::numeric, 160506.03::numeric),
      ('3.4.001', 0::numeric, 182927.20::numeric),
      ('3.5.001', 0::numeric, 11591.96::numeric)
    ) AS mov(codigo, debe, haber)
    JOIN contabilidad.cuenta c ON c.codigo = mov.codigo;
  END IF;
END;
$$;

COMMIT;
