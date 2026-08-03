-- 019_seed_catalogos_academicos_scz_correcciones.sql
-- Correcciones sobre los seeders académicos 007/008:
--   1) Ampliación del catálogo persona.unidad_educativa con más universidades,
--      institutos y colegios del departamento de Santa Cruz (ciudad capital,
--      área metropolitana y capitales de provincia).
--   2) Consolidación de servicios_educativos.producto_educativo: debe existir un
--      único producto de tipo CLASE_POR_HORA ("Clase por hora"). La materia
--      (Matemáticas, Física, Química, ...) se define en materia_tree, no en el
--      producto, por lo que los productos por materia se fusionan en el canónico.
--
-- Idempotente: se puede ejecutar varias veces sin duplicar ni perder datos.

-- ---------------------------------------------------------------------------
-- 1) Unidades educativas adicionales de Santa Cruz
-- ---------------------------------------------------------------------------

INSERT INTO persona.unidad_educativa (nombre, categoria, estado_registro, fecha_registro, fecha_modificacion, version_registro)
SELECT v.nombre, v.categoria, true, now(), now(), 1
FROM (VALUES
    -- Universidades e institutos superiores
    ('Universidad Privada del Valle (UNIVALLE) - Sede Santa Cruz', 'privada'),
    ('Universidad Técnica Privada Cosmos (UNITEPC) - Sede Santa Cruz', 'privada'),
    ('Universidad Salesiana de Bolivia - Sede Santa Cruz', 'privada'),
    ('Universidad Central de Bolivia (UNICEN) - Sede Santa Cruz', 'privada'),
    ('Universidad Privada Abierta Latinoamericana (UPAL) - Sede Santa Cruz', 'privada'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral del Norte (Montero)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral del Chaco (Camiri)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral de los Valles (Vallegrande)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral de Ichilo (Yapacaní)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral de Chiquitos (San José de Chiquitos)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral del Nor Este (San Ignacio de Velasco)', 'fiscal'),
    ('Universidad Autónoma Gabriel René Moreno - Facultad Integral de Guarayos (Ascensión de Guarayos)', 'fiscal'),
    ('Escuela Superior de Formación de Maestros Enrique Finot', 'fiscal'),
    ('Fundación INFOCAL Santa Cruz', 'convenio'),
    ('Instituto Técnico Agropecuario Muyurina (Montero)', 'convenio'),

    -- Colegios privados y de convenio de la ciudad de Santa Cruz
    ('Colegio Nuestra Señora del Carmen Santa Cruz', 'convenio'),
    ('Colegio Nuestra Señora del Rosario Santa Cruz', 'convenio'),
    ('Colegio San Ignacio de Loyola Santa Cruz', 'privada'),
    ('Colegio San José Obrero Santa Cruz', 'convenio'),
    ('Colegio San Pedro Santa Cruz', 'privada'),
    ('Colegio San Pablo Santa Cruz', 'privada'),
    ('Colegio Santa Mónica Santa Cruz', 'privada'),
    ('Colegio Santa Isabel Santa Cruz', 'privada'),
    ('Colegio Sagrada Familia Santa Cruz', 'convenio'),
    ('Colegio Corazón de María Santa Cruz', 'convenio'),
    ('Colegio Jesús Maestro Santa Cruz', 'convenio'),
    ('Colegio Divino Maestro Santa Cruz', 'privada'),
    ('Colegio Cristiano Ebenezer Santa Cruz', 'privada'),
    ('Colegio Cristiano Emanuel Santa Cruz', 'privada'),
    ('Colegio Bautista Santa Cruz', 'privada'),
    ('Colegio Metodista Santa Cruz', 'convenio'),
    ('Colegio Luterano Santa Cruz', 'privada'),
    ('Colegio Menonita Santa Cruz', 'privada'),
    ('Colegio Israelita Santa Cruz', 'privada'),
    ('Colegio Japonés Nikkei Santa Cruz', 'privada'),
    ('Colegio Americano Santa Cruz', 'privada'),
    ('Colegio Oxford Santa Cruz', 'privada'),
    ('Colegio Newton College Santa Cruz', 'privada'),
    ('Colegio Einstein Santa Cruz', 'privada'),
    ('Colegio Da Vinci Santa Cruz', 'privada'),
    ('Colegio Galileo Santa Cruz', 'privada'),
    ('Colegio Piaget Santa Cruz', 'privada'),
    ('Colegio Nueva Generación Santa Cruz', 'privada'),
    ('Colegio Nuevo Milenio Santa Cruz', 'privada'),
    ('Colegio Génesis Santa Cruz', 'privada'),
    ('Colegio Emaús Santa Cruz', 'privada'),
    ('Colegio Belén Santa Cruz', 'privada'),
    ('Colegio El Buen Pastor Santa Cruz', 'convenio'),
    ('Colegio Los Ángeles Santa Cruz', 'privada'),
    ('Colegio Santa Rosa Santa Cruz', 'privada'),
    ('Colegio Central Santa Cruz', 'privada'),
    ('Colegio Técnico Humanístico Santa Cruz', 'privada'),

    -- Red Fe y Alegría (convenio) en Santa Cruz
    ('Unidad Educativa Fe y Alegría San José', 'convenio'),
    ('Unidad Educativa Fe y Alegría Plan Tres Mil', 'convenio'),
    ('Unidad Educativa Fe y Alegría Villa Primero de Mayo', 'convenio'),
    ('Unidad Educativa Fe y Alegría Los Lotes', 'convenio'),
    ('Unidad Educativa Fe y Alegría Nueva Esperanza', 'convenio'),
    ('Unidad Educativa Fe y Alegría El Bajío', 'convenio'),

    -- Unidades educativas fiscales de la ciudad de Santa Cruz
    ('Unidad Educativa 24 de Septiembre', 'fiscal'),
    ('Unidad Educativa 27 de Mayo', 'fiscal'),
    ('Unidad Educativa 6 de Agosto', 'fiscal'),
    ('Unidad Educativa 15 de Agosto', 'fiscal'),
    ('Unidad Educativa 2 de Agosto', 'fiscal'),
    ('Unidad Educativa Bolivia', 'fiscal'),
    ('Unidad Educativa Litoral', 'fiscal'),
    ('Unidad Educativa Antofagasta', 'fiscal'),
    ('Unidad Educativa Eduardo Abaroa', 'fiscal'),
    ('Unidad Educativa Mariscal Antonio José de Sucre', 'fiscal'),
    ('Unidad Educativa Mariscal José Ballivián', 'fiscal'),
    ('Unidad Educativa Simón Rodríguez', 'fiscal'),
    ('Unidad Educativa Tomás Frías', 'fiscal'),
    ('Unidad Educativa Franz Tamayo', 'fiscal'),
    ('Unidad Educativa Gabriel René Moreno', 'fiscal'),
    ('Unidad Educativa Ñuflo de Chávez', 'fiscal'),
    ('Unidad Educativa Hernando Sanabria Fernández', 'fiscal'),
    ('Unidad Educativa José Manuel Baca', 'fiscal'),
    ('Unidad Educativa Marcelo Quiroga Santa Cruz', 'fiscal'),
    ('Unidad Educativa Villa Primero de Mayo', 'fiscal'),
    ('Unidad Educativa Plan Tres Mil', 'fiscal'),
    ('Unidad Educativa Barrio Lindo', 'fiscal'),
    ('Unidad Educativa Los Lotes', 'fiscal'),
    ('Unidad Educativa El Trompillo', 'fiscal'),
    ('Unidad Educativa La Merced', 'fiscal'),
    ('Unidad Educativa El Bajío', 'fiscal'),
    ('Unidad Educativa Pampa de la Isla', 'fiscal'),
    ('Unidad Educativa Los Chacos', 'fiscal'),
    ('Unidad Educativa Nueva Santa Cruz', 'fiscal'),
    ('Unidad Educativa Villa Rosario', 'fiscal'),
    ('Unidad Educativa Cotoca Centro', 'fiscal'),
    ('Unidad Educativa Puerto Rico Santa Cruz', 'fiscal'),
    ('Unidad Educativa Santa Fe Santa Cruz', 'fiscal'),
    ('Unidad Educativa Los Olivos Santa Cruz', 'fiscal'),
    ('Unidad Educativa El Dorado Santa Cruz', 'fiscal'),
    ('Unidad Educativa Guaracachi', 'fiscal'),
    ('Unidad Educativa Palmasola', 'fiscal'),
    ('Unidad Educativa Villa Warnes', 'fiscal'),

    -- Área metropolitana y capitales de provincia
    ('Unidad Educativa Nacional Montero', 'fiscal'),
    ('Unidad Educativa Nacional Warnes', 'fiscal'),
    ('Unidad Educativa Nacional La Guardia', 'fiscal'),
    ('Unidad Educativa Nacional El Torno', 'fiscal'),
    ('Unidad Educativa Nacional Cotoca', 'fiscal'),
    ('Unidad Educativa Nacional Porongo', 'fiscal'),
    ('Unidad Educativa Nacional Portachuelo', 'fiscal'),
    ('Unidad Educativa Nacional Buena Vista', 'fiscal'),
    ('Unidad Educativa Nacional Yapacaní', 'fiscal'),
    ('Unidad Educativa Nacional San Carlos', 'fiscal'),
    ('Unidad Educativa Nacional Mineros', 'fiscal'),
    ('Unidad Educativa Nacional San Julián', 'fiscal'),
    ('Unidad Educativa Nacional Pailón', 'fiscal'),
    ('Unidad Educativa Nacional Okinawa Uno', 'fiscal'),
    ('Unidad Educativa Nacional Camiri', 'fiscal'),
    ('Unidad Educativa Nacional Charagua', 'fiscal'),
    ('Unidad Educativa Nacional Lagunillas', 'fiscal'),
    ('Unidad Educativa Nacional Vallegrande', 'fiscal'),
    ('Unidad Educativa Nacional Samaipata', 'fiscal'),
    ('Unidad Educativa Nacional Mairana', 'fiscal'),
    ('Unidad Educativa Nacional Comarapa', 'fiscal'),
    ('Unidad Educativa Nacional Saipina', 'fiscal'),
    ('Unidad Educativa Nacional San Ignacio de Velasco', 'fiscal'),
    ('Unidad Educativa Nacional San Miguel de Velasco', 'fiscal'),
    ('Unidad Educativa Nacional San Rafael de Velasco', 'fiscal'),
    ('Unidad Educativa Nacional San José de Chiquitos', 'fiscal'),
    ('Unidad Educativa Nacional Concepción', 'fiscal'),
    ('Unidad Educativa Nacional San Javier', 'fiscal'),
    ('Unidad Educativa Nacional San Ramón', 'fiscal'),
    ('Unidad Educativa Nacional Ascensión de Guarayos', 'fiscal'),
    ('Unidad Educativa Nacional Urubichá', 'fiscal'),
    ('Unidad Educativa Nacional El Puente Guarayos', 'fiscal'),
    ('Unidad Educativa Nacional Roboré', 'fiscal'),
    ('Unidad Educativa Nacional Puerto Suárez', 'fiscal'),
    ('Unidad Educativa Nacional Puerto Quijarro', 'fiscal'),
    ('Unidad Educativa Nacional San Matías', 'fiscal'),
    ('Unidad Educativa Nacional Cabezas', 'fiscal'),
    ('Unidad Educativa Nacional Gutiérrez', 'fiscal'),
    ('Unidad Educativa Nacional Cuevo', 'fiscal'),
    ('Unidad Educativa Nacional Boyuibe', 'fiscal'),
    ('Colegio Alemán Montero', 'privada'),
    ('Colegio Don Bosco Montero', 'convenio'),
    ('Colegio La Salle Montero', 'convenio'),
    ('Colegio Adventista Montero', 'convenio'),
    ('Colegio Santa Ana Warnes', 'convenio'),
    ('Colegio Cristo Rey Camiri', 'convenio'),
    ('Colegio San Antonio de Padua San Ignacio de Velasco', 'convenio')
) AS v(nombre, categoria)
WHERE NOT EXISTS (
  SELECT 1
  FROM persona.unidad_educativa u
  WHERE lower(trim(u.nombre)) = lower(trim(v.nombre))
);

-- ---------------------------------------------------------------------------
-- 2) Un único producto educativo de tipo CLASE_POR_HORA
-- ---------------------------------------------------------------------------

INSERT INTO servicios_educativos.producto_educativo (
  nombre, tipo_producto, descripcion, precio_base,
  lim_sup_estudiantes, lim_inf_estudiantes,
  estado_registro, fecha_registro, fecha_modificacion, version_registro
)
SELECT
  'Clase por hora',
  'CLASE_POR_HORA',
  'Servicio base de clase particular por hora. La materia, tema y subtema se definen en materia_tree.',
  0, 1, 1, true, now(), now(), 1
WHERE NOT EXISTS (
  SELECT 1
  FROM servicios_educativos.producto_educativo p
  WHERE lower(trim(p.nombre)) = 'clase por hora'
);

DO $$
DECLARE
  v_id_canonico bigint;
  v_duplicados  bigint[];
  r             record;
BEGIN
  SELECT p.id_producto_educativo
    INTO v_id_canonico
  FROM servicios_educativos.producto_educativo p
  WHERE lower(trim(p.nombre)) = 'clase por hora'
  ORDER BY p.id_producto_educativo
  LIMIT 1;

  IF v_id_canonico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el producto canónico "Clase por hora".';
  END IF;

  UPDATE servicios_educativos.producto_educativo
     SET nombre              = 'Clase por hora',
         tipo_producto       = 'CLASE_POR_HORA',
         descripcion         = 'Servicio base de clase particular por hora. La materia, tema y subtema se definen en materia_tree.',
         lim_sup_estudiantes = 1,
         lim_inf_estudiantes = 1,
         estado_registro     = true
   WHERE id_producto_educativo = v_id_canonico;

  SELECT coalesce(array_agg(p.id_producto_educativo), ARRAY[]::bigint[])
    INTO v_duplicados
  FROM servicios_educativos.producto_educativo p
  WHERE upper(trim(p.tipo_producto)) = 'CLASE_POR_HORA'
    AND p.id_producto_educativo <> v_id_canonico;

  IF array_length(v_duplicados, 1) IS NULL THEN
    RAISE NOTICE 'Sin productos CLASE_POR_HORA duplicados; catálogo ya consolidado.';
    RETURN;
  END IF;

  -- Repuntar cualquier referencia (FK) hacia el producto canónico antes de borrar.
  FOR r IN
    SELECT c.conrelid::regclass AS tabla, a.attname AS columna
    FROM pg_constraint c
    JOIN unnest(c.conkey) AS k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.confrelid = 'servicios_educativos.producto_educativo'::regclass
      AND array_length(c.conkey, 1) = 1
  LOOP
    EXECUTE format(
      'UPDATE %s SET %I = $1 WHERE %I = ANY($2)',
      r.tabla, r.columna, r.columna
    ) USING v_id_canonico, v_duplicados;
  END LOOP;

  DELETE FROM servicios_educativos.producto_educativo
   WHERE id_producto_educativo = ANY(v_duplicados);

  RAISE NOTICE 'Productos CLASE_POR_HORA consolidados en id=% (eliminados: %).',
    v_id_canonico, array_length(v_duplicados, 1);
END $$;

-- Ajuste de secuencias después de inserts manuales o migraciones previas.
SELECT setval('persona.unidad_educativa_id_unidad_educativa_seq', COALESCE((SELECT max(id_unidad_educativa) FROM persona.unidad_educativa), 1), true);
SELECT setval('servicios_educativos.producto_educativo_id_producto_educativo_seq', COALESCE((SELECT max(id_producto_educativo) FROM servicios_educativos.producto_educativo), 1), true);
