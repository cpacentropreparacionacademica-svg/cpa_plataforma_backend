# Módulo contabilidad

Módulo NestJS migrado desde routers Express. Expone únicamente los recursos definidos originalmente para `contabilidad`.

Recursos expuestos:
- `archivos-transaccion` → `contabilidad.transaccion`
- `centro-costo` → `contabilidad.cuenta`
- `centro-costo-mapa` → `contabilidad.centro_costo`
- `concepto-costo` → `contabilidad.concepto_costo`
- `cuenta` → `contabilidad.grupo_cuenta`
- `cuenta-asignacion` → `administracion.empleado`
- `grupo-cuenta` → `contabilidad.grupo_cuenta`
- `pago-tutor` → `persona.persona_tutor`
- `pago-tutor-detalle` → `contabilidad.pago_tutor`
- `transaccion` → `contabilidad.centro_costo_mapa`
- `transaccion-movimiento-cuenta` → `contabilidad.transaccion`
