# Módulo infraestructura

Módulo NestJS migrado desde routers Express. Expone únicamente los recursos definidos originalmente para `infraestructura`.

Recursos expuestos:
- `edificio` → `infraestructura.sucursal`
- `encargado` → `infraestructura.sucursal`
- `espacio` → `infraestructura.edificio`
- `sucursal` → `infraestructura.sucursal`
- `tienda` → `infraestructura.espacio`
