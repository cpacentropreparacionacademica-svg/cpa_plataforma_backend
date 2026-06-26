# Seed de catálogos académicos Santa Cruz ampliado

Archivos agregados/actualizados:

```txt
./docs/db/migrations/007_seed_catalogos_academicos_scz.sql
./docs/db/migrations/008_seed_catalogos_academicos_scz_ampliacion.sql
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
