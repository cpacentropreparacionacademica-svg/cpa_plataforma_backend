-- 012_patch_borradores_archivos_independientes.sql
-- Objetivo:
-- 1) Permitir borradores backend para cualquier registro/recurso sin forzar escrituras incompletas en tablas finales.
-- 2) Separar archivo/documento de la asociación archivo-transacción.
-- 3) Mantener compatibilidad con contabilidad.archivos_transaccion legado.

CREATE TABLE IF NOT EXISTS administracion.registro_borrador (
  id_borrador bigserial PRIMARY KEY,
  modulo varchar(80) NOT NULL,
  recurso varchar(120) NOT NULL,
  operacion varchar(30) NOT NULL DEFAULT 'create',
  titulo varchar(180),
  descripcion text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ids_json jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado_borrador varchar(30) NOT NULL DEFAULT 'BORRADOR',
  clave_cliente varchar(160),
  fecha_expiracion timestamptz,
  estado_registro varchar(20) DEFAULT 'Activo',
  fecha_registro timestamptz DEFAULT now(),
  fecha_modificacion timestamptz,
  version_registro integer DEFAULT 1,
  id_usuario_creador bigint,
  id_usuario_modificacion bigint,
  CONSTRAINT registro_borrador_estado_chk CHECK (estado_borrador IN ('BORRADOR', 'LISTO', 'PUBLICADO', 'DESCARTADO')),
  CONSTRAINT registro_borrador_operacion_chk CHECK (operacion IN ('create', 'update', 'upsert'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_registro_borrador_clave_cliente_usuario
  ON administracion.registro_borrador (id_usuario_creador, clave_cliente)
  WHERE clave_cliente IS NOT NULL AND estado_registro = 'Activo';

CREATE INDEX IF NOT EXISTS ix_registro_borrador_usuario_estado
  ON administracion.registro_borrador (id_usuario_creador, estado_borrador, fecha_registro DESC);

CREATE INDEX IF NOT EXISTS ix_registro_borrador_recurso
  ON administracion.registro_borrador (modulo, recurso, operacion);

COMMENT ON TABLE administracion.registro_borrador IS 'Borradores genéricos de registros del frontend. Permite guardar payloads incompletos sin romper constraints de tablas finales.';
COMMENT ON COLUMN administracion.registro_borrador.payload_json IS 'Payload de la pantalla/recurso todavía no confirmado. No debe ejecutarse como registro final hasta publicarse desde la UI o servicio correspondiente.';

-- Archivo maestro independiente: un archivo puede existir sin transacción.
CREATE TABLE IF NOT EXISTS contabilidad.archivo (
  id_archivo bigserial PRIMARY KEY,
  nombre_archivo varchar(255),
  descripcion text,
  url_archivo text NOT NULL,
  tipo_mime varchar(120),
  tamano_bytes bigint,
  storage_provider varchar(80),
  storage_key text,
  checksum_sha256 varchar(64),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado_registro varchar(20) DEFAULT 'Activo',
  fecha_registro timestamptz DEFAULT now(),
  fecha_modificacion timestamptz,
  version_registro integer DEFAULT 1,
  id_usuario_creador bigint,
  id_usuario_modificacion bigint,
  CONSTRAINT archivo_tamano_non_negative_chk CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS ix_archivo_estado_fecha
  ON contabilidad.archivo (estado_registro, fecha_registro DESC);

CREATE INDEX IF NOT EXISTS ix_archivo_checksum
  ON contabilidad.archivo (checksum_sha256)
  WHERE checksum_sha256 IS NOT NULL;

COMMENT ON TABLE contabilidad.archivo IS 'Maestro de archivos/documentos. Puede existir sin transacción contable asociada.';

-- Asociación N:M entre archivo y transacción. Esta es la tabla relacional nueva.
CREATE TABLE IF NOT EXISTS contabilidad.archivo_transaccion (
  id_archivo_transaccion bigserial PRIMARY KEY,
  id_archivo bigint NOT NULL REFERENCES contabilidad.archivo(id_archivo) ON DELETE RESTRICT,
  id_transaccion bigint NOT NULL REFERENCES contabilidad.transaccion(id_transaccion) ON DELETE RESTRICT,
  tipo_asociacion varchar(80) DEFAULT 'SOPORTE',
  observacion text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado_registro varchar(20) DEFAULT 'Activo',
  fecha_registro timestamptz DEFAULT now(),
  fecha_modificacion timestamptz,
  version_registro integer DEFAULT 1,
  id_usuario_creador bigint,
  id_usuario_modificacion bigint,
  CONSTRAINT ux_archivo_transaccion_activo UNIQUE (id_archivo, id_transaccion, tipo_asociacion)
);

CREATE INDEX IF NOT EXISTS ix_archivo_transaccion_transaccion
  ON contabilidad.archivo_transaccion (id_transaccion, estado_registro);

CREATE INDEX IF NOT EXISTS ix_archivo_transaccion_archivo
  ON contabilidad.archivo_transaccion (id_archivo, estado_registro);

COMMENT ON TABLE contabilidad.archivo_transaccion IS 'Tabla puente archivo-transacción. Permite asociar archivos independientes a transacciones sin mezclar metadata del archivo.';

-- Compatibilidad con tabla legado: permitir archivos sin transacción en el recurso antiguo si algún frontend todavía lo usa.
ALTER TABLE contabilidad.archivos_transaccion
  ALTER COLUMN id_transaccion DROP NOT NULL;

ALTER TABLE contabilidad.archivos_transaccion
  ALTER COLUMN link_achivo DROP NOT NULL;

-- Permisos base para recursos nuevos. Si ya existen, no falla.
INSERT INTO seguridad.permiso (codigo, descripcion, modulo, estado_registro)
VALUES
  ('ADMINISTRACION.REGISTRO_BORRADOR.CREATE', 'Crear registros en borrador [ADMINISTRACION]', 'ADMINISTRACION', 'Activo'),
  ('ADMINISTRACION.REGISTRO_BORRADOR.READ', 'Ver/listar registros en borrador [ADMINISTRACION]', 'ADMINISTRACION', 'Activo'),
  ('ADMINISTRACION.REGISTRO_BORRADOR.UPDATE', 'Actualizar/descartar registros en borrador [ADMINISTRACION]', 'ADMINISTRACION', 'Activo'),
  ('CONTABILIDAD.ARCHIVO.CREATE', 'Crear archivos independientes [CONTABILIDAD]', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ARCHIVO.READ', 'Ver/listar archivos independientes [CONTABILIDAD]', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ARCHIVO.UPDATE', 'Actualizar archivos independientes [CONTABILIDAD]', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ARCHIVO_TRANSACCION.CREATE', 'Asociar archivos a transacciones [CONTABILIDAD]', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ARCHIVO_TRANSACCION.READ', 'Ver/listar asociaciones archivo-transacción [CONTABILIDAD]', 'CONTABILIDAD', 'Activo'),
  ('CONTABILIDAD.ARCHIVO_TRANSACCION.UPDATE', 'Actualizar asociaciones archivo-transacción [CONTABILIDAD]', 'CONTABILIDAD', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo,
  estado_registro = 'Activo';

-- Otorgar a roles administrativos/contables si existen. No rompe si no existen.
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo IN (
  'ADMINISTRACION.REGISTRO_BORRADOR.CREATE',
  'ADMINISTRACION.REGISTRO_BORRADOR.READ',
  'ADMINISTRACION.REGISTRO_BORRADOR.UPDATE',
  'CONTABILIDAD.ARCHIVO.CREATE',
  'CONTABILIDAD.ARCHIVO.READ',
  'CONTABILIDAD.ARCHIVO.UPDATE',
  'CONTABILIDAD.ARCHIVO_TRANSACCION.CREATE',
  'CONTABILIDAD.ARCHIVO_TRANSACCION.READ',
  'CONTABILIDAD.ARCHIVO_TRANSACCION.UPDATE'
)
WHERE UPPER(COALESCE(r.nombre, '')) IN ('ADMINISTRADOR GENERAL', 'CONTADOR', 'ADMINISTRADOR')
ON CONFLICT DO NOTHING;
