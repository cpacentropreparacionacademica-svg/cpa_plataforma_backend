# Seed de catálogos académicos Santa Cruz ampliado

Archivos agregados/actualizados:

```txt
./docs/db/migrations/007_seed_catalogos_academicos_scz.sql
./docs/db/migrations/008_seed_catalogos_academicos_scz_ampliacion.sql
./docs/db/migrations/019_seed_catalogos_academicos_scz_correcciones.sql
```

## Qué carga

### `servicios_educativos.materia_tree`

Carga `182` filas para:

- Matemáticas
- Física
- Química

Cada fila usa:

```txt
nombre = materia
tema = área o capítulo
subtema = contenido específico
```

También corrige la restricción de unicidad de `materia_tree`:

```txt
Antes: UNIQUE(nombre)
Ahora: UNIQUE(nombre, tema, subtema)
```

Esto permite tener muchas filas por materia, por ejemplo:

```txt
Matemáticas -> Álgebra -> Ecuaciones cuadráticas
Física -> Cinemática -> Caída libre
Química -> Tabla periódica -> Propiedades periódicas
```

### `persona.unidad_educativa`

Carga `91` unidades educativas de Santa Cruz de la Sierra, mezclando universidades, colegios privados, de convenio y fiscales.

Categorías usadas:

```txt
privada
convenio
fiscal
```

### `servicios_educativos.producto_educativo`

Carga `31` productos educativos base, incluyendo explícitamente:

- Clases de Matemáticas.
- Clases de Física.
- Clases de Química.
- Curso de Becas CRE.
- Curso de Becas CRE por materia.
- Cursos preuniversitarios.
- Nivelaciones.
- Talleres.
- Simulacros.
- Paquetes de horas.

## Correcciones aplicadas por `019_seed_catalogos_academicos_scz_correcciones.sql`

### Más unidades educativas

Suma `145` unidades educativas adicionales del departamento de Santa Cruz, con lo que el catálogo queda en `237`:

- Universidades e institutos superiores no cubiertos por 007 (UNIVALLE, UNITEPC, Salesiana, UNICEN, UPAL, INFOCAL, ESFM Enrique Finot).
- Las siete facultades integrales de la UAGRM (Montero, Camiri, Vallegrande, Yapacaní, San José de Chiquitos, San Ignacio de Velasco, Ascensión de Guarayos).
- Colegios privados y de convenio de la ciudad, red Fe y Alegría y unidades fiscales de barrios (Plan Tres Mil, Villa Primero de Mayo, Los Lotes, Pampa de la Isla, entre otros).
- Unidades educativas de capitales de provincia y del área metropolitana (Montero, Warnes, La Guardia, El Torno, Cotoca, Portachuelo, Camiri, Vallegrande, San Ignacio de Velasco, Puerto Suárez, etc.).

> El catálogo es semilla de arranque. Antes de considerarlo definitivo conviene contrastarlo con el registro oficial del SIE/RUE del Ministerio de Educación; el endpoint de creación permite dar de alta cualquier unidad faltante.

### Un solo producto de clase por hora

`servicios_educativos.producto_educativo` queda con **un único** registro de tipo `CLASE_POR_HORA`:

```txt
Clase por hora
```

Se eliminan los productos por materia (`Clases de Matemáticas`, `Clases de Física`, `Clases de Química`, `Clase por hora - Matemáticas`, `Clase por hora - Física`, `Clase por hora - Química`), porque la materia, el tema y el subtema se definen en `servicios_educativos.materia_tree`, no en el producto.

Antes de borrar, la migración repunta dinámicamente **todas** las claves foráneas que apuntan a `producto_educativo` (transacciones, detalle de venta, venta por clase, `curso_version`, objetivos KPI) hacia el producto canónico, de modo que ningún movimiento histórico queda huérfano.

### Se aplica solo, en cada arranque

`scripts/render-start.js` ejecuta `scripts/startup-db.js` antes de levantar Nest:

1. Migraciones pendientes (`scripts/migrate-prod.js`), protegidas por checksum y `pg_advisory_lock`.
2. Re-ejecución de los seeds declarados en `IDEMPOTENT_SEEDS` (hoy, la 019), **siempre**, estén o no registrados como migración.

El segundo paso existe porque un seed de catálogo no es un cambio de esquema: debe converger en cada arranque. Si se agregan más colegios al archivo o alguien crea a mano un producto `CLASE_POR_HORA` extra, el siguiente reinicio deja la base en el estado declarado, sin migración nueva.

Comprobado con tres arranques consecutivos sobre la misma base: 237 unidades, 182 filas de `materia_tree` y un único `Clase por hora`. Tras borrar una unidad e insertar un `Clases de Biología` a mano, el arranque siguiente restauró la unidad y absorbió el producto intruso.

Interruptores (ambos por defecto activos):

```bash
MIGRATE_ON_START=false   # arranca sin aplicar migraciones
SEED_ON_START=false      # arranca sin reconciliar los seeds de catálogo
```

Si el paso falla, el proceso termina con código 1 y el backend no arranca: es preferible a servir con un esquema o un catálogo desactualizado.

Para ejecutarlo a mano, sin levantar el servidor:

```bash
yarn db:startup
```

## Cómo aplicar

Producción en blanco:

```bash
yarn db:migrate:prod:fresh
```

Producción ya migrada:

```bash
yarn db:migrate:prod
```

## Endpoints útiles para frontend

```http
GET /api/servicios_educativos/materia-tree
GET /api/personas/unidad-educativa
GET /api/servicios_educativos/producto-educativo
```

Filtros útiles:

```http
GET /api/servicios_educativos/materia-tree?nombre=Matemáticas
GET /api/servicios_educativos/materia-tree?nombre=Física
GET /api/servicios_educativos/materia-tree?nombre=Química
GET /api/personas/unidad-educativa?categoria=privada
GET /api/servicios_educativos/producto-educativo?tipo_producto=CLASE_POR_HORA
```
