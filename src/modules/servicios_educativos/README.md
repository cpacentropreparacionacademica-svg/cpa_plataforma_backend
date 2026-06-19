# Módulo servicios_educativos

Módulo NestJS migrado desde routers Express. Expone únicamente los recursos definidos originalmente para `servicios_educativos`.

Recursos expuestos:
- `asistencia-clase-curso` → `servicios_educativos.clase_curso`
- `clase-curso` → `servicios_educativos.curso_version`
- `clase-por-hora` → `infraestructura.espacio`
- `curso-version` → `servicios_educativos.producto_educativo`
- `horarios` → `servicios_educativos.horarios`
- `materia-tree` → `servicios_educativos.materia_tree`
- `paquetes-producto-educativo` → `servicios_educativos.paquetes_producto_educativo`
- `producto-educativo` → `inventario.bien`
