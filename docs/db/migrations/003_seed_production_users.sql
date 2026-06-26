-- Migration: 003_seed_production_users.sql
-- Propósito: seed de seguridad/RBAC, entidades base y usuarios productivos iniciales.
-- Fuente: seed_rbac_roles_permisos_entidades_base_cpa.json
-- Resumen fuente: 17 roles, 489 permisos consolidados, 2 usuarios base.
-- Nota: el backend actual valida contraseñas con SHA-256, por eso se insertan hashes SHA-256 precomputados.

BEGIN;

-- Roles funcionales
INSERT INTO seguridad.rol (codigo, nombre, descripcion, estado_registro)
VALUES
  ('SUPER_ADMIN', 'Super usuario', 'Acceso total y administración completa del sistema. Debe usarse solo para propietarios o administradores técnicos de máxima confianza.', 'Activo'),
  ('ADMIN_GENERAL', 'Administrador general', 'Operación general sin ser superusuario técnico. Gestiona módulos operativos, no debe tocar secretos ni permisos críticos salvo asignaciones autorizadas.', 'Activo'),
  ('CONTADOR_GENERAL', 'Contador general', 'Gestión contable, EEFF, transacciones, centros de costo, pagos, conciliaciones, reportes financieros y revisión de caja.', 'Activo'),
  ('AUXILIAR_CONTABLE', 'Auxiliar contable', 'Apoyo contable: registro inicial, consulta y exportación; no aprueba, no anula, no cierra períodos.', 'Activo'),
  ('CAJERO', 'Cajero', 'Registra cobros/pagos de caja y consulta deudas/recibos; no gestiona plan de cuentas ni cierres.', 'Activo'),
  ('DIRECTOR_ACADEMICO', 'Director académico', 'Gestiona productos educativos, cursos, horarios, clases, tutores, asistencia y reportes académicos.', 'Activo'),
  ('COORDINADOR_ACADEMICO', 'Coordinador académico', 'Operación académica diaria: clases, horarios, asistencia y materias.', 'Activo'),
  ('TUTOR_DOCENTE', 'Tutor/docente', 'Consulta clases asignadas y registra asistencia o cierre de clases habilitadas.', 'Activo'),
  ('ENCARGADO_TIENDA', 'Encargado de tienda', 'Administra tienda, ventas operativas, productos y movimientos de inventario.', 'Activo'),
  ('ALMACEN_INVENTARIO', 'Almacén e inventario', 'Gestiona bienes, lotes, instancias, kardex y movimientos de almacén.', 'Activo'),
  ('RRHH_ADMIN', 'Recursos humanos', 'Gestiona empleados, posiciones, departamentos, pagos laborales y reportes de RRHH.', 'Activo'),
  ('SOPORTE_TI', 'Soporte TI', 'Soporte a usuarios, sesiones y bitácora. No tiene privilegios contables de aprobación.', 'Activo'),
  ('LEGAL_SOCIETARIO', 'Legal societario', 'Gestiona títulos societarios, titulares, emisiones, tenencias, dividendos y transferencias.', 'Activo'),
  ('AUDITOR_LECTURA', 'Auditor de lectura', 'Consulta transversal de información y auditoría sin crear, modificar, aprobar ni anular.', 'Activo'),
  ('ESTUDIANTE_PORTAL', 'Estudiante portal', 'Rol recomendado para autoservicio de estudiante; debe complementarse con reglas por dueño del registro.', 'Activo'),
  ('PADRE_PORTAL', 'Padre/madre portal', 'Rol recomendado para consulta de pagos, asistencia y datos de estudiantes vinculados.', 'Activo'),
  ('CONTADOR', 'Contador', 'Rol alias para contador operativo. Hereda permisos del rol CONTADOR_GENERAL.', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.rol.version_registro, 1) + 1;

-- Permisos de RBAC funcional + compatibilidad con resource-registry NestJS
INSERT INTO seguridad.permiso (codigo, descripcion, modulo)
VALUES
  ('ACADEMICO.ASISTENCIA.VER', 'Ver/listar/consultar registros: asistencia [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.ASISTENCIA.REGISTRAR', 'Registrar operación transaccional: asistencia [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.ASISTENCIA.EDITAR', 'Modificar registros existentes: asistencia [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.ASISTENCIA.EXPORTAR', 'Exportar información a reportes o archivos: asistencia [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASES.VER', 'Ver/listar/consultar registros: clases [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASES.REGISTRAR', 'Registrar operación transaccional: clases [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASES.EDITAR', 'Modificar registros existentes: clases [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASES.CANCELAR', 'Cancelar operación académica: clases [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASES.EXPORTAR', 'Exportar información a reportes o archivos: clases [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_CURSO.VER', 'Ver/listar/consultar registros: clase curso [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_CURSO.CREAR', 'Crear nuevos registros: clase curso [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_CURSO.EDITAR', 'Modificar registros existentes: clase curso [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_CURSO.CANCELAR', 'Cancelar operación académica: clase curso [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_POR_HORA.VER', 'Ver/listar/consultar registros: clase por hora [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_POR_HORA.CREAR', 'Crear nuevos registros: clase por hora [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_POR_HORA.EDITAR', 'Modificar registros existentes: clase por hora [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_POR_HORA.CERRAR', 'Cerrar sesión o clase abierta: clase por hora [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CLASE_POR_HORA.ANULAR', 'Anular documento u operación con trazabilidad: clase por hora [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSOS.VER', 'Ver/listar/consultar registros: cursos [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSOS.CREAR', 'Crear nuevos registros: cursos [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSOS.EDITAR', 'Modificar registros existentes: cursos [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSOS.DESACTIVAR', 'Activar o desactivar registros lógicos: cursos [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSOS.GESTIONAR', 'Administrar de forma integral el recurso: cursos [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSO_VERSION.VER', 'Ver/listar/consultar registros: curso version [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSO_VERSION.CREAR', 'Crear nuevos registros: curso version [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSO_VERSION.EDITAR', 'Modificar registros existentes: curso version [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.CURSO_VERSION.DESACTIVAR', 'Activar o desactivar registros lógicos: curso version [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.HORARIOS.VER', 'Ver/listar/consultar registros: horarios [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.HORARIOS.CREAR', 'Crear nuevos registros: horarios [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.HORARIOS.EDITAR', 'Modificar registros existentes: horarios [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.HORARIOS.DESACTIVAR', 'Activar o desactivar registros lógicos: horarios [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.HORARIOS.GESTIONAR', 'Administrar de forma integral el recurso: horarios [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.MATERIA_TREE.VER', 'Ver/listar/consultar registros: materia tree [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.MATERIA_TREE.CREAR', 'Crear nuevos registros: materia tree [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.MATERIA_TREE.EDITAR', 'Modificar registros existentes: materia tree [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.MATERIA_TREE.DESACTIVAR', 'Activar o desactivar registros lógicos: materia tree [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.MATERIA_TREE.IMPORTAR', 'Importar datos masivos: materia tree [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PAQUETES.VER', 'Ver/listar/consultar registros: paquetes [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PAQUETES.CREAR', 'Crear nuevos registros: paquetes [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PAQUETES.EDITAR', 'Modificar registros existentes: paquetes [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PAQUETES.DESACTIVAR', 'Activar o desactivar registros lógicos: paquetes [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PAQUETES.GESTIONAR', 'Administrar de forma integral el recurso: paquetes [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO.VER', 'Ver/listar/consultar registros: producto [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO.CREAR', 'Crear nuevos registros: producto [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO.EDITAR', 'Modificar registros existentes: producto [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO.DESACTIVAR', 'Activar o desactivar registros lógicos: producto [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO.GESTIONAR', 'Administrar de forma integral el recurso: producto [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO_EDUCATIVO.VER', 'Ver/listar/consultar registros: producto educativo [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO_EDUCATIVO.CREAR', 'Crear nuevos registros: producto educativo [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO_EDUCATIVO.EDITAR', 'Modificar registros existentes: producto educativo [ACADEMICO]', 'ACADEMICO'),
  ('ACADEMICO.PRODUCTO_EDUCATIVO.DESACTIVAR', 'Activar o desactivar registros lógicos: producto educativo [ACADEMICO]', 'ACADEMICO'),
  ('ADMIN.DEPARTAMENTO.VER', 'Ver/listar/consultar registros: departamento [ADMIN]', 'ADMIN'),
  ('ADMIN.DEPARTAMENTO.CREAR', 'Crear nuevos registros: departamento [ADMIN]', 'ADMIN'),
  ('ADMIN.DEPARTAMENTO.EDITAR', 'Modificar registros existentes: departamento [ADMIN]', 'ADMIN'),
  ('ADMIN.DEPARTAMENTO.DESACTIVAR', 'Activar o desactivar registros lógicos: departamento [ADMIN]', 'ADMIN'),
  ('ADMIN.DEPARTAMENTO.GESTIONAR', 'Administrar de forma integral el recurso: departamento [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.VER', 'Ver/listar/consultar registros: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.CREAR', 'Crear nuevos registros: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.EDITAR', 'Modificar registros existentes: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.DESACTIVAR', 'Activar o desactivar registros lógicos: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.GESTIONAR', 'Administrar de forma integral el recurso: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO.EXPORTAR', 'Exportar información a reportes o archivos: empleado [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_POSICION_PAGO.VER', 'Ver/listar/consultar registros: empleado posicion pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_POSICION_PAGO.CREAR', 'Crear nuevos registros: empleado posicion pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_POSICION_PAGO.EDITAR', 'Modificar registros existentes: empleado posicion pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_POSICION_PAGO.DESACTIVAR', 'Activar o desactivar registros lógicos: empleado posicion pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_REGISTRO_PAGO.VER', 'Ver/listar/consultar registros: empleado registro pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_REGISTRO_PAGO.CREAR', 'Crear nuevos registros: empleado registro pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_REGISTRO_PAGO.EDITAR', 'Modificar registros existentes: empleado registro pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_REGISTRO_PAGO.ANULAR', 'Anular documento u operación con trazabilidad: empleado registro pago [ADMIN]', 'ADMIN'),
  ('ADMIN.EMPLEADO_REGISTRO_PAGO.EXPORTAR', 'Exportar información a reportes o archivos: empleado registro pago [ADMIN]', 'ADMIN'),
  ('ADMIN.KPI.VER', 'Ver/listar/consultar registros: kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.KPI.CREAR', 'Crear nuevos registros: kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.KPI.EDITAR', 'Modificar registros existentes: kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.KPI.DESACTIVAR', 'Activar o desactivar registros lógicos: kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.KPI.GESTIONAR', 'Administrar de forma integral el recurso: kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.NOMINA.VER', 'Ver/listar/consultar registros: nomina [ADMIN]', 'ADMIN'),
  ('ADMIN.NOMINA.GESTIONAR', 'Administrar de forma integral el recurso: nomina [ADMIN]', 'ADMIN'),
  ('ADMIN.NOMINA.EXPORTAR', 'Exportar información a reportes o archivos: nomina [ADMIN]', 'ADMIN'),
  ('ADMIN.OBJETIVO_KPI.VER', 'Ver/listar/consultar registros: objetivo kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.OBJETIVO_KPI.CREAR', 'Crear nuevos registros: objetivo kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.OBJETIVO_KPI.EDITAR', 'Modificar registros existentes: objetivo kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.OBJETIVO_KPI.DESACTIVAR', 'Activar o desactivar registros lógicos: objetivo kpi [ADMIN]', 'ADMIN'),
  ('ADMIN.POSICION.VER', 'Ver/listar/consultar registros: posicion [ADMIN]', 'ADMIN'),
  ('ADMIN.POSICION.CREAR', 'Crear nuevos registros: posicion [ADMIN]', 'ADMIN'),
  ('ADMIN.POSICION.EDITAR', 'Modificar registros existentes: posicion [ADMIN]', 'ADMIN'),
  ('ADMIN.POSICION.DESACTIVAR', 'Activar o desactivar registros lógicos: posicion [ADMIN]', 'ADMIN'),
  ('ADMIN.POSICION.GESTIONAR', 'Administrar de forma integral el recurso: posicion [ADMIN]', 'ADMIN'),
  ('AUDITORIA.CAMBIOS_CRITICOS.VER', 'Ver/listar/consultar registros: cambios criticos [AUDITORIA]', 'AUDITORIA'),
  ('AUDITORIA.CAMBIOS_CRITICOS.EXPORTAR', 'Exportar información a reportes o archivos: cambios criticos [AUDITORIA]', 'AUDITORIA'),
  ('AUDITORIA.PERMISOS_EFECTIVOS.VER', 'Ver/listar/consultar registros: permisos efectivos [AUDITORIA]', 'AUDITORIA'),
  ('AUDITORIA.PERMISOS_EFECTIVOS.EXPORTAR', 'Exportar información a reportes o archivos: permisos efectivos [AUDITORIA]', 'AUDITORIA'),
  ('AUDITORIA.TRAZABILIDAD.VER', 'Ver/listar/consultar registros: trazabilidad [AUDITORIA]', 'AUDITORIA'),
  ('AUDITORIA.TRAZABILIDAD.EXPORTAR', 'Exportar información a reportes o archivos: trazabilidad [AUDITORIA]', 'AUDITORIA'),
  ('CAJA.COBRANZA.VER', 'Ver/listar/consultar registros: cobranza [CAJA]', 'CAJA'),
  ('CAJA.COBRANZA.GESTIONAR', 'Administrar de forma integral el recurso: cobranza [CAJA]', 'CAJA'),
  ('CAJA.COBRANZA.EXPORTAR', 'Exportar información a reportes o archivos: cobranza [CAJA]', 'CAJA'),
  ('CAJA.DEUDA.VER', 'Ver/listar/consultar registros: deuda [CAJA]', 'CAJA'),
  ('CAJA.DEUDA.CREAR', 'Crear nuevos registros: deuda [CAJA]', 'CAJA'),
  ('CAJA.DEUDA.EDITAR', 'Modificar registros existentes: deuda [CAJA]', 'CAJA'),
  ('CAJA.DEUDA.ANULAR', 'Anular documento u operación con trazabilidad: deuda [CAJA]', 'CAJA'),
  ('CAJA.DEUDA.EXPORTAR', 'Exportar información a reportes o archivos: deuda [CAJA]', 'CAJA'),
  ('CAJA.PAGO.VER', 'Ver/listar/consultar registros: pago [CAJA]', 'CAJA'),
  ('CAJA.PAGO.REGISTRAR', 'Registrar operación transaccional: pago [CAJA]', 'CAJA'),
  ('CAJA.PAGO.EDITAR', 'Modificar registros existentes: pago [CAJA]', 'CAJA'),
  ('CAJA.PAGO.ANULAR', 'Anular documento u operación con trazabilidad: pago [CAJA]', 'CAJA'),
  ('CAJA.PAGO.EXPORTAR', 'Exportar información a reportes o archivos: pago [CAJA]', 'CAJA'),
  ('CAJA.RECIBOS.VER', 'Ver/listar/consultar registros: recibos [CAJA]', 'CAJA'),
  ('CAJA.RECIBOS.EMITIR', 'Emitir documento formal: recibos [CAJA]', 'CAJA'),
  ('CAJA.RECIBOS.ANULAR', 'Anular documento u operación con trazabilidad: recibos [CAJA]', 'CAJA'),
  ('CAJA.RECIBOS.EXPORTAR', 'Exportar información a reportes o archivos: recibos [CAJA]', 'CAJA'),
  ('CONFIG.CATALOGOS.VER', 'Ver/listar/consultar registros: catalogos [CONFIG]', 'CONFIG'),
  ('CONFIG.CATALOGOS.GESTIONAR', 'Administrar de forma integral el recurso: catalogos [CONFIG]', 'CONFIG'),
  ('CONFIG.MAPEOS_CONTABLES.VER', 'Ver/listar/consultar registros: mapeos contables [CONFIG]', 'CONFIG'),
  ('CONFIG.MAPEOS_CONTABLES.GESTIONAR', 'Administrar de forma integral el recurso: mapeos contables [CONFIG]', 'CONFIG'),
  ('CONFIG.PARAMETROS_NEGOCIO.VER', 'Ver/listar/consultar registros: parametros negocio [CONFIG]', 'CONFIG'),
  ('CONFIG.PARAMETROS_NEGOCIO.GESTIONAR', 'Administrar de forma integral el recurso: parametros negocio [CONFIG]', 'CONFIG'),
  ('CONTAB.ARCHIVOS_TRANSACCION.VER', 'Ver/listar/consultar registros: archivos transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.ARCHIVOS_TRANSACCION.SUBIR', 'Subir archivo/documento: archivos transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.ARCHIVOS_TRANSACCION.ELIMINAR', 'Eliminar archivo asociado: archivos transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO.VER', 'Ver/listar/consultar registros: centro costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO.CREAR', 'Crear nuevos registros: centro costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO.EDITAR', 'Modificar registros existentes: centro costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO.DESACTIVAR', 'Activar o desactivar registros lógicos: centro costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO.GESTIONAR', 'Administrar de forma integral el recurso: centro costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO_MAPA.VER', 'Ver/listar/consultar registros: centro costo mapa [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO_MAPA.CREAR', 'Crear nuevos registros: centro costo mapa [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO_MAPA.EDITAR', 'Modificar registros existentes: centro costo mapa [CONTAB]', 'CONTAB'),
  ('CONTAB.CENTRO_COSTO_MAPA.DESACTIVAR', 'Activar o desactivar registros lógicos: centro costo mapa [CONTAB]', 'CONTAB'),
  ('CONTAB.CIERRE_PERIODO.VER', 'Ver/listar/consultar registros: cierre periodo [CONTAB]', 'CONTAB'),
  ('CONTAB.CIERRE_PERIODO.EJECUTAR', 'Ejecutar proceso controlado: cierre periodo [CONTAB]', 'CONTAB'),
  ('CONTAB.CIERRE_PERIODO.APROBAR', 'Aprobar operación crítica: cierre periodo [CONTAB]', 'CONTAB'),
  ('CONTAB.CIERRE_PERIODO.REVERTIR', 'Revertir cierre/proceso con control: cierre periodo [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCEPTO_COSTO.VER', 'Ver/listar/consultar registros: concepto costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCEPTO_COSTO.CREAR', 'Crear nuevos registros: concepto costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCEPTO_COSTO.EDITAR', 'Modificar registros existentes: concepto costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCEPTO_COSTO.DESACTIVAR', 'Activar o desactivar registros lógicos: concepto costo [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCILIACION.VER', 'Ver/listar/consultar registros: conciliacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCILIACION.GESTIONAR', 'Administrar de forma integral el recurso: conciliacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CONCILIACION.APROBAR', 'Aprobar operación crítica: conciliacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.VER', 'Ver/listar/consultar registros: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.CREAR', 'Crear nuevos registros: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.EDITAR', 'Modificar registros existentes: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.DESACTIVAR', 'Activar o desactivar registros lógicos: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.GESTIONAR', 'Administrar de forma integral el recurso: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA.EXPORTAR', 'Exportar información a reportes o archivos: cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTAS.VER', 'Ver/listar/consultar registros: cuentas [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTAS.GESTIONAR', 'Administrar de forma integral el recurso: cuentas [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA_ASIGNACION.VER', 'Ver/listar/consultar registros: cuenta asignacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA_ASIGNACION.CREAR', 'Crear nuevos registros: cuenta asignacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA_ASIGNACION.EDITAR', 'Modificar registros existentes: cuenta asignacion [CONTAB]', 'CONTAB'),
  ('CONTAB.CUENTA_ASIGNACION.DESACTIVAR', 'Activar o desactivar registros lógicos: cuenta asignacion [CONTAB]', 'CONTAB'),
  ('CONTAB.EEFF.VER', 'Ver/listar/consultar registros: eeff [CONTAB]', 'CONTAB'),
  ('CONTAB.EEFF.GENERAR', 'Generar reporte o proceso: eeff [CONTAB]', 'CONTAB'),
  ('CONTAB.EEFF.EXPORTAR', 'Exportar información a reportes o archivos: eeff [CONTAB]', 'CONTAB'),
  ('CONTAB.GRUPO_CUENTA.VER', 'Ver/listar/consultar registros: grupo cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.GRUPO_CUENTA.CREAR', 'Crear nuevos registros: grupo cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.GRUPO_CUENTA.EDITAR', 'Modificar registros existentes: grupo cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.GRUPO_CUENTA.DESACTIVAR', 'Activar o desactivar registros lógicos: grupo cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.LIBRO_DIARIO.VER', 'Ver/listar/consultar registros: libro diario [CONTAB]', 'CONTAB'),
  ('CONTAB.LIBRO_DIARIO.EXPORTAR', 'Exportar información a reportes o archivos: libro diario [CONTAB]', 'CONTAB'),
  ('CONTAB.LIBRO_MAYOR.VER', 'Ver/listar/consultar registros: libro mayor [CONTAB]', 'CONTAB'),
  ('CONTAB.LIBRO_MAYOR.EXPORTAR', 'Exportar información a reportes o archivos: libro mayor [CONTAB]', 'CONTAB'),
  ('CONTAB.MOVIMIENTO_CUENTA.VER', 'Ver/listar/consultar registros: movimiento cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.MOVIMIENTO_CUENTA.REGISTRAR', 'Registrar operación transaccional: movimiento cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.MOVIMIENTO_CUENTA.EDITAR', 'Modificar registros existentes: movimiento cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.MOVIMIENTO_CUENTA.ANULAR', 'Anular documento u operación con trazabilidad: movimiento cuenta [CONTAB]', 'CONTAB'),
  ('CONTAB.PAGO_TUTOR.VER', 'Ver/listar/consultar registros: pago tutor [CONTAB]', 'CONTAB'),
  ('CONTAB.PAGO_TUTOR.GESTIONAR', 'Administrar de forma integral el recurso: pago tutor [CONTAB]', 'CONTAB'),
  ('CONTAB.PAGO_TUTOR.APROBAR', 'Aprobar operación crítica: pago tutor [CONTAB]', 'CONTAB'),
  ('CONTAB.PAGO_TUTOR.ANULAR', 'Anular documento u operación con trazabilidad: pago tutor [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.VER', 'Ver/listar/consultar registros: transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.REGISTRAR', 'Registrar operación transaccional: transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.EDITAR', 'Modificar registros existentes: transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.ANULAR', 'Anular documento u operación con trazabilidad: transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.APROBAR', 'Aprobar operación crítica: transaccion [CONTAB]', 'CONTAB'),
  ('CONTAB.TRANSACCION.EXPORTAR', 'Exportar información a reportes o archivos: transaccion [CONTAB]', 'CONTAB'),
  ('INFRA.EDIFICIO.VER', 'Ver/listar/consultar registros: edificio [INFRA]', 'INFRA'),
  ('INFRA.EDIFICIO.CREAR', 'Crear nuevos registros: edificio [INFRA]', 'INFRA'),
  ('INFRA.EDIFICIO.EDITAR', 'Modificar registros existentes: edificio [INFRA]', 'INFRA'),
  ('INFRA.EDIFICIO.DESACTIVAR', 'Activar o desactivar registros lógicos: edificio [INFRA]', 'INFRA'),
  ('INFRA.ENCARGADO.VER', 'Ver/listar/consultar registros: encargado [INFRA]', 'INFRA'),
  ('INFRA.ENCARGADO.CREAR', 'Crear nuevos registros: encargado [INFRA]', 'INFRA'),
  ('INFRA.ENCARGADO.EDITAR', 'Modificar registros existentes: encargado [INFRA]', 'INFRA'),
  ('INFRA.ENCARGADO.DESACTIVAR', 'Activar o desactivar registros lógicos: encargado [INFRA]', 'INFRA'),
  ('INFRA.ESPACIO.VER', 'Ver/listar/consultar registros: espacio [INFRA]', 'INFRA'),
  ('INFRA.ESPACIO.CREAR', 'Crear nuevos registros: espacio [INFRA]', 'INFRA'),
  ('INFRA.ESPACIO.EDITAR', 'Modificar registros existentes: espacio [INFRA]', 'INFRA'),
  ('INFRA.ESPACIO.DESACTIVAR', 'Activar o desactivar registros lógicos: espacio [INFRA]', 'INFRA'),
  ('INFRA.SUCURSAL.VER', 'Ver/listar/consultar registros: sucursal [INFRA]', 'INFRA'),
  ('INFRA.SUCURSAL.CREAR', 'Crear nuevos registros: sucursal [INFRA]', 'INFRA'),
  ('INFRA.SUCURSAL.EDITAR', 'Modificar registros existentes: sucursal [INFRA]', 'INFRA'),
  ('INFRA.SUCURSAL.DESACTIVAR', 'Activar o desactivar registros lógicos: sucursal [INFRA]', 'INFRA'),
  ('INFRA.TIENDA.VER', 'Ver/listar/consultar registros: tienda [INFRA]', 'INFRA'),
  ('INFRA.TIENDA.CREAR', 'Crear nuevos registros: tienda [INFRA]', 'INFRA'),
  ('INFRA.TIENDA.EDITAR', 'Modificar registros existentes: tienda [INFRA]', 'INFRA'),
  ('INFRA.TIENDA.DESACTIVAR', 'Activar o desactivar registros lógicos: tienda [INFRA]', 'INFRA'),
  ('INV.BIEN.VER', 'Ver/listar/consultar registros: bien [INV]', 'INV'),
  ('INV.BIEN.CREAR', 'Crear nuevos registros: bien [INV]', 'INV'),
  ('INV.BIEN.EDITAR', 'Modificar registros existentes: bien [INV]', 'INV'),
  ('INV.BIEN.DESACTIVAR', 'Activar o desactivar registros lógicos: bien [INV]', 'INV'),
  ('INV.BIEN.GESTIONAR', 'Administrar de forma integral el recurso: bien [INV]', 'INV'),
  ('INV.BIEN.EXPORTAR', 'Exportar información a reportes o archivos: bien [INV]', 'INV'),
  ('INV.BIEN_INSTANCIA.VER', 'Ver/listar/consultar registros: bien instancia [INV]', 'INV'),
  ('INV.BIEN_INSTANCIA.CREAR', 'Crear nuevos registros: bien instancia [INV]', 'INV'),
  ('INV.BIEN_INSTANCIA.EDITAR', 'Modificar registros existentes: bien instancia [INV]', 'INV'),
  ('INV.BIEN_INSTANCIA.DESACTIVAR', 'Activar o desactivar registros lógicos: bien instancia [INV]', 'INV'),
  ('INV.BIEN_LOTE.VER', 'Ver/listar/consultar registros: bien lote [INV]', 'INV'),
  ('INV.BIEN_LOTE.CREAR', 'Crear nuevos registros: bien lote [INV]', 'INV'),
  ('INV.BIEN_LOTE.EDITAR', 'Modificar registros existentes: bien lote [INV]', 'INV'),
  ('INV.BIEN_LOTE.DESACTIVAR', 'Activar o desactivar registros lógicos: bien lote [INV]', 'INV'),
  ('INV.DEPRECIACION.VER', 'Ver/listar/consultar registros: depreciacion [INV]', 'INV'),
  ('INV.DEPRECIACION.EJECUTAR', 'Ejecutar proceso controlado: depreciacion [INV]', 'INV'),
  ('INV.DEPRECIACION.EXPORTAR', 'Exportar información a reportes o archivos: depreciacion [INV]', 'INV'),
  ('INV.KARDEX.VER', 'Ver/listar/consultar registros: kardex [INV]', 'INV'),
  ('INV.KARDEX.EXPORTAR', 'Exportar información a reportes o archivos: kardex [INV]', 'INV'),
  ('INV.MOVIMIENTO.VER', 'Ver/listar/consultar registros: movimiento [INV]', 'INV'),
  ('INV.MOVIMIENTO.REGISTRAR', 'Registrar operación transaccional: movimiento [INV]', 'INV'),
  ('INV.MOVIMIENTO.EDITAR', 'Modificar registros existentes: movimiento [INV]', 'INV'),
  ('INV.MOVIMIENTO.ANULAR', 'Anular documento u operación con trazabilidad: movimiento [INV]', 'INV'),
  ('INV.MOVIMIENTO_DETALLE.VER', 'Ver/listar/consultar registros: movimiento detalle [INV]', 'INV'),
  ('INV.MOVIMIENTO_DETALLE.REGISTRAR', 'Registrar operación transaccional: movimiento detalle [INV]', 'INV'),
  ('INV.MOVIMIENTO_DETALLE.EDITAR', 'Modificar registros existentes: movimiento detalle [INV]', 'INV'),
  ('INV.MOVIMIENTO_DETALLE.ANULAR', 'Anular documento u operación con trazabilidad: movimiento detalle [INV]', 'INV'),
  ('INV.VALUACION.VER', 'Ver/listar/consultar registros: valuacion [INV]', 'INV'),
  ('INV.VALUACION.EJECUTAR', 'Ejecutar proceso controlado: valuacion [INV]', 'INV'),
  ('INV.VALUACION.EXPORTAR', 'Exportar información a reportes o archivos: valuacion [INV]', 'INV'),
  ('PERSONA.ESTUDIANTE.CREAR', 'Crear nuevos registros: estudiante [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTES.VER', 'Ver/listar/consultar registros: estudiantes [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTES.CREAR', 'Crear nuevos registros: estudiantes [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTES.EDITAR', 'Modificar registros existentes: estudiantes [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTES.DESACTIVAR', 'Activar o desactivar registros lógicos: estudiantes [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTES.EXPORTAR', 'Exportar información a reportes o archivos: estudiantes [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTE_PADRE.VER', 'Ver/listar/consultar registros: estudiante padre [PERSONA]', 'PERSONA'),
  ('PERSONA.ESTUDIANTE_PADRE.GESTIONAR', 'Administrar de forma integral el recurso: estudiante padre [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRE.CREAR', 'Crear nuevos registros: padre [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRES.VER', 'Ver/listar/consultar registros: padres [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRES.CREAR', 'Crear nuevos registros: padres [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRES.EDITAR', 'Modificar registros existentes: padres [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRES.DESACTIVAR', 'Activar o desactivar registros lógicos: padres [PERSONA]', 'PERSONA'),
  ('PERSONA.PADRES.EXPORTAR', 'Exportar información a reportes o archivos: padres [PERSONA]', 'PERSONA'),
  ('PERSONA.PERSONAS.VER', 'Ver/listar/consultar registros: personas [PERSONA]', 'PERSONA'),
  ('PERSONA.PERSONAS.CREAR', 'Crear nuevos registros: personas [PERSONA]', 'PERSONA'),
  ('PERSONA.PERSONAS.EDITAR', 'Modificar registros existentes: personas [PERSONA]', 'PERSONA'),
  ('PERSONA.PERSONAS.DESACTIVAR', 'Activar o desactivar registros lógicos: personas [PERSONA]', 'PERSONA'),
  ('PERSONA.PERSONAS.EXPORTAR', 'Exportar información a reportes o archivos: personas [PERSONA]', 'PERSONA'),
  ('PERSONA.PROVEEDORES.VER', 'Ver/listar/consultar registros: proveedores [PERSONA]', 'PERSONA'),
  ('PERSONA.PROVEEDORES.CREAR', 'Crear nuevos registros: proveedores [PERSONA]', 'PERSONA'),
  ('PERSONA.PROVEEDORES.EDITAR', 'Modificar registros existentes: proveedores [PERSONA]', 'PERSONA'),
  ('PERSONA.PROVEEDORES.DESACTIVAR', 'Activar o desactivar registros lógicos: proveedores [PERSONA]', 'PERSONA'),
  ('PERSONA.PROVEEDORES.EXPORTAR', 'Exportar información a reportes o archivos: proveedores [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTOR.CREAR', 'Crear nuevos registros: tutor [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTORES.VER', 'Ver/listar/consultar registros: tutores [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTORES.CREAR', 'Crear nuevos registros: tutores [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTORES.EDITAR', 'Modificar registros existentes: tutores [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTORES.DESACTIVAR', 'Activar o desactivar registros lógicos: tutores [PERSONA]', 'PERSONA'),
  ('PERSONA.TUTORES.EXPORTAR', 'Exportar información a reportes o archivos: tutores [PERSONA]', 'PERSONA'),
  ('PERSONA.UNIDAD_EDUCATIVA.VER', 'Ver/listar/consultar registros: unidad educativa [PERSONA]', 'PERSONA'),
  ('PERSONA.UNIDAD_EDUCATIVA.CREAR', 'Crear nuevos registros: unidad educativa [PERSONA]', 'PERSONA'),
  ('PERSONA.UNIDAD_EDUCATIVA.EDITAR', 'Modificar registros existentes: unidad educativa [PERSONA]', 'PERSONA'),
  ('PERSONA.UNIDAD_EDUCATIVA.DESACTIVAR', 'Activar o desactivar registros lógicos: unidad educativa [PERSONA]', 'PERSONA'),
  ('PERSONA.UNIDAD_EDUCATIVA.EXPORTAR', 'Exportar información a reportes o archivos: unidad educativa [PERSONA]', 'PERSONA'),
  ('PERSONA.USUARIOS.VER', 'Ver/listar/consultar registros: usuarios [PERSONA]', 'PERSONA'),
  ('REPORTES.ACADEMICOS.VER', 'Ver/listar/consultar registros: academicos [REPORTES]', 'REPORTES'),
  ('REPORTES.ACADEMICOS.GENERAR', 'Generar reporte o proceso: academicos [REPORTES]', 'REPORTES'),
  ('REPORTES.ACADEMICOS.EXPORTAR', 'Exportar información a reportes o archivos: academicos [REPORTES]', 'REPORTES'),
  ('REPORTES.COMERCIALES.VER', 'Ver/listar/consultar registros: comerciales [REPORTES]', 'REPORTES'),
  ('REPORTES.COMERCIALES.GENERAR', 'Generar reporte o proceso: comerciales [REPORTES]', 'REPORTES'),
  ('REPORTES.COMERCIALES.EXPORTAR', 'Exportar información a reportes o archivos: comerciales [REPORTES]', 'REPORTES'),
  ('REPORTES.EJECUTIVO.VER', 'Ver/listar/consultar registros: ejecutivo [REPORTES]', 'REPORTES'),
  ('REPORTES.EJECUTIVO.GENERAR', 'Generar reporte o proceso: ejecutivo [REPORTES]', 'REPORTES'),
  ('REPORTES.EJECUTIVO.EXPORTAR', 'Exportar información a reportes o archivos: ejecutivo [REPORTES]', 'REPORTES'),
  ('REPORTES.FINANCIEROS.VER', 'Ver/listar/consultar registros: financieros [REPORTES]', 'REPORTES'),
  ('REPORTES.FINANCIEROS.GENERAR', 'Generar reporte o proceso: financieros [REPORTES]', 'REPORTES'),
  ('REPORTES.FINANCIEROS.EXPORTAR', 'Exportar información a reportes o archivos: financieros [REPORTES]', 'REPORTES'),
  ('REPORTES.INVENTARIO.VER', 'Ver/listar/consultar registros: inventario [REPORTES]', 'REPORTES'),
  ('REPORTES.INVENTARIO.GENERAR', 'Generar reporte o proceso: inventario [REPORTES]', 'REPORTES'),
  ('REPORTES.INVENTARIO.EXPORTAR', 'Exportar información a reportes o archivos: inventario [REPORTES]', 'REPORTES'),
  ('REPORTES.RRHH.VER', 'Ver/listar/consultar registros: rrhh [REPORTES]', 'REPORTES'),
  ('REPORTES.RRHH.GENERAR', 'Generar reporte o proceso: rrhh [REPORTES]', 'REPORTES'),
  ('REPORTES.RRHH.EXPORTAR', 'Exportar información a reportes o archivos: rrhh [REPORTES]', 'REPORTES'),
  ('SISTEMA.LOGS.VER', 'Ver/listar/consultar registros: logs [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.LOGS.EXPORTAR', 'Exportar información a reportes o archivos: logs [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.PERMISOS.VER', 'Ver/listar/consultar registros: permisos [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.PERMISOS.GESTIONAR', 'Administrar de forma integral el recurso: permisos [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.ROLES.VER', 'Ver/listar/consultar registros: roles [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.ROLES.GESTIONAR', 'Administrar de forma integral el recurso: roles [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.ROLES.CREAR', 'Crear nuevos registros: roles [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.ROLES.EDITAR', 'Modificar registros existentes: roles [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.ROLES.DESACTIVAR', 'Activar o desactivar registros lógicos: roles [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.SESIONES.VER', 'Ver/listar/consultar registros: sesiones [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.SESIONES.CERRAR', 'Cerrar sesión o clase abierta: sesiones [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.TOKEN_ACCION.VER', 'Ver/listar/consultar registros: token accion [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.TOKEN_ACCION.REVOCAR', 'Revocar token o acceso: token accion [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.VER', 'Ver/listar/consultar registros: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.CREAR', 'Crear nuevos registros: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.EDITAR', 'Modificar registros existentes: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.DESACTIVAR', 'Activar o desactivar registros lógicos: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.ASIGNAR_ROL', 'Asignar roles a usuarios: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.RESET_PASSWORD', 'Restablecer contraseña de usuario: usuarios [SISTEMA]', 'SISTEMA'),
  ('SISTEMA.USUARIOS.EXPORTAR', 'Exportar información a reportes o archivos: usuarios [SISTEMA]', 'SISTEMA'),
  ('SOC.CLASE_TITULO.VER', 'Ver/listar/consultar registros: clase titulo [SOC]', 'SOC'),
  ('SOC.CLASE_TITULO.CREAR', 'Crear nuevos registros: clase titulo [SOC]', 'SOC'),
  ('SOC.CLASE_TITULO.EDITAR', 'Modificar registros existentes: clase titulo [SOC]', 'SOC'),
  ('SOC.CLASE_TITULO.DESACTIVAR', 'Activar o desactivar registros lógicos: clase titulo [SOC]', 'SOC'),
  ('SOC.DIVIDENDO.VER', 'Ver/listar/consultar registros: dividendo [SOC]', 'SOC'),
  ('SOC.DIVIDENDO.CREAR', 'Crear nuevos registros: dividendo [SOC]', 'SOC'),
  ('SOC.DIVIDENDO.APROBAR', 'Aprobar operación crítica: dividendo [SOC]', 'SOC'),
  ('SOC.DIVIDENDO.ANULAR', 'Anular documento u operación con trazabilidad: dividendo [SOC]', 'SOC'),
  ('SOC.DIVIDENDO_PAGO.VER', 'Ver/listar/consultar registros: dividendo pago [SOC]', 'SOC'),
  ('SOC.DIVIDENDO_PAGO.REGISTRAR', 'Registrar operación transaccional: dividendo pago [SOC]', 'SOC'),
  ('SOC.DIVIDENDO_PAGO.ANULAR', 'Anular documento u operación con trazabilidad: dividendo pago [SOC]', 'SOC'),
  ('SOC.EMISION_TITULO.VER', 'Ver/listar/consultar registros: emision titulo [SOC]', 'SOC'),
  ('SOC.EMISION_TITULO.CREAR', 'Crear nuevos registros: emision titulo [SOC]', 'SOC'),
  ('SOC.EMISION_TITULO.EDITAR', 'Modificar registros existentes: emision titulo [SOC]', 'SOC'),
  ('SOC.EMISION_TITULO.ANULAR', 'Anular documento u operación con trazabilidad: emision titulo [SOC]', 'SOC'),
  ('SOC.TENENCIA.VER', 'Ver/listar/consultar registros: tenencia [SOC]', 'SOC'),
  ('SOC.TENENCIA.CREAR', 'Crear nuevos registros: tenencia [SOC]', 'SOC'),
  ('SOC.TENENCIA.EDITAR', 'Modificar registros existentes: tenencia [SOC]', 'SOC'),
  ('SOC.TENENCIA.AJUSTAR', 'Registrar ajuste controlado: tenencia [SOC]', 'SOC'),
  ('SOC.TITULAR.VER', 'Ver/listar/consultar registros: titular [SOC]', 'SOC'),
  ('SOC.TITULAR.CREAR', 'Crear nuevos registros: titular [SOC]', 'SOC'),
  ('SOC.TITULAR.EDITAR', 'Modificar registros existentes: titular [SOC]', 'SOC'),
  ('SOC.TITULAR.DESACTIVAR', 'Activar o desactivar registros lógicos: titular [SOC]', 'SOC'),
  ('SOC.TITULOS.VER', 'Ver/listar/consultar registros: titulos [SOC]', 'SOC'),
  ('SOC.TITULOS.GESTIONAR', 'Administrar de forma integral el recurso: titulos [SOC]', 'SOC'),
  ('SOC.TRANSFERENCIA_TITULO.VER', 'Ver/listar/consultar registros: transferencia titulo [SOC]', 'SOC'),
  ('SOC.TRANSFERENCIA_TITULO.CREAR', 'Crear nuevos registros: transferencia titulo [SOC]', 'SOC'),
  ('SOC.TRANSFERENCIA_TITULO.ANULAR', 'Anular documento u operación con trazabilidad: transferencia titulo [SOC]', 'SOC'),
  ('ADMINISTRACION.DEPARTAMENTO.CREATE', 'Permiso de API NestJS ADMINISTRACION.DEPARTAMENTO.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.DEPARTAMENTO.READ', 'Permiso de API NestJS ADMINISTRACION.DEPARTAMENTO.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.DEPARTAMENTO.UPDATE', 'Permiso de API NestJS ADMINISTRACION.DEPARTAMENTO.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO.CREATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO.READ', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO.UPDATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_POSICION_PAGO.CREATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_POSICION_PAGO.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_POSICION_PAGO.UPDATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_POSICION_PAGO.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.CREATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.UPDATE', 'Permiso de API NestJS ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.KPI.CREATE', 'Permiso de API NestJS ADMINISTRACION.KPI.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.KPI.READ', 'Permiso de API NestJS ADMINISTRACION.KPI.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.KPI.UPDATE', 'Permiso de API NestJS ADMINISTRACION.KPI.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.OBJETIVO_KPI.CREATE', 'Permiso de API NestJS ADMINISTRACION.OBJETIVO_KPI.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.OBJETIVO_KPI.READ', 'Permiso de API NestJS ADMINISTRACION.OBJETIVO_KPI.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.OBJETIVO_KPI.UPDATE', 'Permiso de API NestJS ADMINISTRACION.OBJETIVO_KPI.UPDATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.POSICION.CREATE', 'Permiso de API NestJS ADMINISTRACION.POSICION.CREATE', 'ADMINISTRACION'),
  ('ADMINISTRACION.POSICION.READ', 'Permiso de API NestJS ADMINISTRACION.POSICION.READ', 'ADMINISTRACION'),
  ('ADMINISTRACION.POSICION.UPDATE', 'Permiso de API NestJS ADMINISTRACION.POSICION.UPDATE', 'ADMINISTRACION'),
  ('CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE', 'Permiso de API NestJS CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.ARCHIVOS_TRANSACCION.READ', 'Permiso de API NestJS CONTABILIDAD.ARCHIVOS_TRANSACCION.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE', 'Permiso de API NestJS CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO.CREATE', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO.READ', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO.UPDATE', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO_MAPA.READ', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO_MAPA.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE', 'Permiso de API NestJS CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CONCEPTO_COSTO.CREATE', 'Permiso de API NestJS CONTABILIDAD.CONCEPTO_COSTO.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CONCEPTO_COSTO.READ', 'Permiso de API NestJS CONTABILIDAD.CONCEPTO_COSTO.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.CONCEPTO_COSTO.UPDATE', 'Permiso de API NestJS CONTABILIDAD.CONCEPTO_COSTO.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA.CREATE', 'Permiso de API NestJS CONTABILIDAD.CUENTA.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA.READ', 'Permiso de API NestJS CONTABILIDAD.CUENTA.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA.UPDATE', 'Permiso de API NestJS CONTABILIDAD.CUENTA.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA_ASIGNACION.CREATE', 'Permiso de API NestJS CONTABILIDAD.CUENTA_ASIGNACION.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA_ASIGNACION.READ', 'Permiso de API NestJS CONTABILIDAD.CUENTA_ASIGNACION.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.CUENTA_ASIGNACION.UPDATE', 'Permiso de API NestJS CONTABILIDAD.CUENTA_ASIGNACION.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.GRUPO_CUENTA.CREATE', 'Permiso de API NestJS CONTABILIDAD.GRUPO_CUENTA.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.GRUPO_CUENTA.READ', 'Permiso de API NestJS CONTABILIDAD.GRUPO_CUENTA.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.GRUPO_CUENTA.UPDATE', 'Permiso de API NestJS CONTABILIDAD.GRUPO_CUENTA.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR.CREATE', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR.READ', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR.UPDATE', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR_DETALLE.READ', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR_DETALLE.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE', 'Permiso de API NestJS CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION.CREATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION.READ', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION.UPDATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.UPDATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE', 'CONTABILIDAD'),
  ('DEUDA.DEUDA.CREATE', 'Permiso de API NestJS DEUDA.DEUDA.CREATE', 'DEUDA'),
  ('DEUDA.DEUDA.READ', 'Permiso de API NestJS DEUDA.DEUDA.READ', 'DEUDA'),
  ('DEUDA.DEUDA.UPDATE', 'Permiso de API NestJS DEUDA.DEUDA.UPDATE', 'DEUDA'),
  ('DEUDA.PAGO.CREATE', 'Permiso de API NestJS DEUDA.PAGO.CREATE', 'DEUDA'),
  ('DEUDA.PAGO.READ', 'Permiso de API NestJS DEUDA.PAGO.READ', 'DEUDA'),
  ('DEUDA.PAGO.UPDATE', 'Permiso de API NestJS DEUDA.PAGO.UPDATE', 'DEUDA'),
  ('INFRAESTRUCTURA.EDIFICIO.CREATE', 'Permiso de API NestJS INFRAESTRUCTURA.EDIFICIO.CREATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.EDIFICIO.READ', 'Permiso de API NestJS INFRAESTRUCTURA.EDIFICIO.READ', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.EDIFICIO.UPDATE', 'Permiso de API NestJS INFRAESTRUCTURA.EDIFICIO.UPDATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ENCARGADO.CREATE', 'Permiso de API NestJS INFRAESTRUCTURA.ENCARGADO.CREATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ENCARGADO.READ', 'Permiso de API NestJS INFRAESTRUCTURA.ENCARGADO.READ', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ENCARGADO.UPDATE', 'Permiso de API NestJS INFRAESTRUCTURA.ENCARGADO.UPDATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ESPACIO.CREATE', 'Permiso de API NestJS INFRAESTRUCTURA.ESPACIO.CREATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ESPACIO.READ', 'Permiso de API NestJS INFRAESTRUCTURA.ESPACIO.READ', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.ESPACIO.UPDATE', 'Permiso de API NestJS INFRAESTRUCTURA.ESPACIO.UPDATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.SUCURSAL.CREATE', 'Permiso de API NestJS INFRAESTRUCTURA.SUCURSAL.CREATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.SUCURSAL.READ', 'Permiso de API NestJS INFRAESTRUCTURA.SUCURSAL.READ', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.SUCURSAL.UPDATE', 'Permiso de API NestJS INFRAESTRUCTURA.SUCURSAL.UPDATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.TIENDA.CREATE', 'Permiso de API NestJS INFRAESTRUCTURA.TIENDA.CREATE', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.TIENDA.READ', 'Permiso de API NestJS INFRAESTRUCTURA.TIENDA.READ', 'INFRAESTRUCTURA'),
  ('INFRAESTRUCTURA.TIENDA.UPDATE', 'Permiso de API NestJS INFRAESTRUCTURA.TIENDA.UPDATE', 'INFRAESTRUCTURA'),
  ('INVENTARIO.BIEN.CREATE', 'Permiso de API NestJS INVENTARIO.BIEN.CREATE', 'INVENTARIO'),
  ('INVENTARIO.BIEN.READ', 'Permiso de API NestJS INVENTARIO.BIEN.READ', 'INVENTARIO'),
  ('INVENTARIO.BIEN.UPDATE', 'Permiso de API NestJS INVENTARIO.BIEN.UPDATE', 'INVENTARIO'),
  ('INVENTARIO.BIEN_INSTANCIA.CREATE', 'Permiso de API NestJS INVENTARIO.BIEN_INSTANCIA.CREATE', 'INVENTARIO'),
  ('INVENTARIO.BIEN_INSTANCIA.READ', 'Permiso de API NestJS INVENTARIO.BIEN_INSTANCIA.READ', 'INVENTARIO'),
  ('INVENTARIO.BIEN_INSTANCIA.UPDATE', 'Permiso de API NestJS INVENTARIO.BIEN_INSTANCIA.UPDATE', 'INVENTARIO'),
  ('INVENTARIO.BIEN_LOTE.CREATE', 'Permiso de API NestJS INVENTARIO.BIEN_LOTE.CREATE', 'INVENTARIO'),
  ('INVENTARIO.BIEN_LOTE.READ', 'Permiso de API NestJS INVENTARIO.BIEN_LOTE.READ', 'INVENTARIO'),
  ('INVENTARIO.BIEN_LOTE.UPDATE', 'Permiso de API NestJS INVENTARIO.BIEN_LOTE.UPDATE', 'INVENTARIO'),
  ('INVENTARIO.MOVIMIENTO_DETALLE.CREATE', 'Permiso de API NestJS INVENTARIO.MOVIMIENTO_DETALLE.CREATE', 'INVENTARIO'),
  ('INVENTARIO.MOVIMIENTO_DETALLE.READ', 'Permiso de API NestJS INVENTARIO.MOVIMIENTO_DETALLE.READ', 'INVENTARIO'),
  ('INVENTARIO.MOVIMIENTO_DETALLE.UPDATE', 'Permiso de API NestJS INVENTARIO.MOVIMIENTO_DETALLE.UPDATE', 'INVENTARIO'),
  ('PERSONAS.PERSONA_ESTUDIANTE.CREATE', 'Permiso de API NestJS PERSONAS.PERSONA_ESTUDIANTE.CREATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_ESTUDIANTE.READ', 'Permiso de API NestJS PERSONAS.PERSONA_ESTUDIANTE.READ', 'PERSONAS'),
  ('PERSONAS.PERSONA_ESTUDIANTE.UPDATE', 'Permiso de API NestJS PERSONAS.PERSONA_ESTUDIANTE.UPDATE', 'PERSONAS'),
  ('PERSONAS.ESTUDIANTE_PADRE.CREATE', 'Permiso de API NestJS PERSONAS.ESTUDIANTE_PADRE.CREATE', 'PERSONAS'),
  ('PERSONAS.ESTUDIANTE_PADRE.READ', 'Permiso de API NestJS PERSONAS.ESTUDIANTE_PADRE.READ', 'PERSONAS'),
  ('PERSONAS.ESTUDIANTE_PADRE.UPDATE', 'Permiso de API NestJS PERSONAS.ESTUDIANTE_PADRE.UPDATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_PADRE.CREATE', 'Permiso de API NestJS PERSONAS.PERSONA_PADRE.CREATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_PADRE.READ', 'Permiso de API NestJS PERSONAS.PERSONA_PADRE.READ', 'PERSONAS'),
  ('PERSONAS.PERSONA_PADRE.UPDATE', 'Permiso de API NestJS PERSONAS.PERSONA_PADRE.UPDATE', 'PERSONAS'),
  ('PERSONAS.PROVEEDOR.CREATE', 'Permiso de API NestJS PERSONAS.PROVEEDOR.CREATE', 'PERSONAS'),
  ('PERSONAS.PROVEEDOR.READ', 'Permiso de API NestJS PERSONAS.PROVEEDOR.READ', 'PERSONAS'),
  ('PERSONAS.PROVEEDOR.UPDATE', 'Permiso de API NestJS PERSONAS.PROVEEDOR.UPDATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_TUTOR.CREATE', 'Permiso de API NestJS PERSONAS.PERSONA_TUTOR.CREATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_TUTOR.READ', 'Permiso de API NestJS PERSONAS.PERSONA_TUTOR.READ', 'PERSONAS'),
  ('PERSONAS.PERSONA_TUTOR.UPDATE', 'Permiso de API NestJS PERSONAS.PERSONA_TUTOR.UPDATE', 'PERSONAS'),
  ('PERSONAS.UNIDAD_EDUCATIVA.CREATE', 'Permiso de API NestJS PERSONAS.UNIDAD_EDUCATIVA.CREATE', 'PERSONAS'),
  ('PERSONAS.UNIDAD_EDUCATIVA.READ', 'Permiso de API NestJS PERSONAS.UNIDAD_EDUCATIVA.READ', 'PERSONAS'),
  ('PERSONAS.UNIDAD_EDUCATIVA.UPDATE', 'Permiso de API NestJS PERSONAS.UNIDAD_EDUCATIVA.UPDATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_USUARIO.CREATE', 'Permiso de API NestJS PERSONAS.PERSONA_USUARIO.CREATE', 'PERSONAS'),
  ('PERSONAS.PERSONA_USUARIO.READ', 'Permiso de API NestJS PERSONAS.PERSONA_USUARIO.READ', 'PERSONAS'),
  ('PERSONAS.PERSONA_USUARIO.UPDATE', 'Permiso de API NestJS PERSONAS.PERSONA_USUARIO.UPDATE', 'PERSONAS'),
  ('SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_CURSO.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_CURSO.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_CURSO.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_CURSO.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CURSO_VERSION.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CURSO_VERSION.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.CURSO_VERSION.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.CURSO_VERSION.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.HORARIOS.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.HORARIOS.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.HORARIOS.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.HORARIOS.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.HORARIOS.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.HORARIOS.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.MATERIA_TREE.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.MATERIA_TREE.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.MATERIA_TREE.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.MATERIA_TREE.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.CREATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.CREATE', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ', 'SERVICIOS_EDUCATIVOS'),
  ('SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.UPDATE', 'Permiso de API NestJS SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.UPDATE', 'SERVICIOS_EDUCATIVOS'),
  ('SOCIETARIO.CLASE_TITULO.CREATE', 'Permiso de API NestJS SOCIETARIO.CLASE_TITULO.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.CLASE_TITULO.READ', 'Permiso de API NestJS SOCIETARIO.CLASE_TITULO.READ', 'SOCIETARIO'),
  ('SOCIETARIO.CLASE_TITULO.UPDATE', 'Permiso de API NestJS SOCIETARIO.CLASE_TITULO.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO.CREATE', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO.READ', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO.READ', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO.UPDATE', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO_PAGO.CREATE', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO_PAGO.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO_PAGO.READ', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO_PAGO.READ', 'SOCIETARIO'),
  ('SOCIETARIO.DIVIDENDO_PAGO.UPDATE', 'Permiso de API NestJS SOCIETARIO.DIVIDENDO_PAGO.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.EMISION_TITULO.CREATE', 'Permiso de API NestJS SOCIETARIO.EMISION_TITULO.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.EMISION_TITULO.READ', 'Permiso de API NestJS SOCIETARIO.EMISION_TITULO.READ', 'SOCIETARIO'),
  ('SOCIETARIO.EMISION_TITULO.UPDATE', 'Permiso de API NestJS SOCIETARIO.EMISION_TITULO.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.TENENCIA.CREATE', 'Permiso de API NestJS SOCIETARIO.TENENCIA.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.TENENCIA.READ', 'Permiso de API NestJS SOCIETARIO.TENENCIA.READ', 'SOCIETARIO'),
  ('SOCIETARIO.TENENCIA.UPDATE', 'Permiso de API NestJS SOCIETARIO.TENENCIA.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.TITULAR.CREATE', 'Permiso de API NestJS SOCIETARIO.TITULAR.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.TITULAR.READ', 'Permiso de API NestJS SOCIETARIO.TITULAR.READ', 'SOCIETARIO'),
  ('SOCIETARIO.TITULAR.UPDATE', 'Permiso de API NestJS SOCIETARIO.TITULAR.UPDATE', 'SOCIETARIO'),
  ('SOCIETARIO.TRANSFERENCIA_TITULO.CREATE', 'Permiso de API NestJS SOCIETARIO.TRANSFERENCIA_TITULO.CREATE', 'SOCIETARIO'),
  ('SOCIETARIO.TRANSFERENCIA_TITULO.READ', 'Permiso de API NestJS SOCIETARIO.TRANSFERENCIA_TITULO.READ', 'SOCIETARIO'),
  ('SOCIETARIO.TRANSFERENCIA_TITULO.UPDATE', 'Permiso de API NestJS SOCIETARIO.TRANSFERENCIA_TITULO.UPDATE', 'SOCIETARIO'),
  ('CONTABILIDAD.TRANSACCION.REVERT', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.REVERT', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION.CON_MOVIMIENTOS', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.CON_MOVIMIENTOS', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION.BATCH_CREATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION.BATCH_CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.BATCH_CREATE', 'Permiso de API NestJS CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.BATCH_CREATE', 'CONTABILIDAD'),
  ('CONTABILIDAD.LIBRO_DIARIO.READ', 'Permiso de API NestJS CONTABILIDAD.LIBRO_DIARIO.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.LIBRO_MAYOR.READ', 'Permiso de API NestJS CONTABILIDAD.LIBRO_MAYOR.READ', 'CONTABILIDAD'),
  ('CONTABILIDAD.EEFF.READ', 'Permiso de API NestJS CONTABILIDAD.EEFF.READ', 'CONTABILIDAD')
ON CONFLICT (codigo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo,
  estado_registro = 'Activo',
  fecha_modificacion = NOW(),
  version_registro = COALESCE(seguridad.permiso.version_registro, 1) + 1;

-- Personas base
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

-- Usuarios base con hash SHA-256 compatible con AuthService
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

-- Sucursales base
INSERT INTO infraestructura.sucursal (codigo, nombre, telefono, email, direccion_linea1, ciudad, departamento, pais, horario_texto, largo_m, ancho_m, estado_registro)
VALUES
  ('SCZ-CENTRO', 'Sucursal Santa Cruz Centro', NULL, NULL, 'Zona Centro, Santa Cruz de la Sierra', 'Santa Cruz de la Sierra', 'Santa Cruz', 'Bolivia', 'Lunes a viernes 08:00-21:00; sábado 08:00-13:00', 25, 18, 'Activo'),
  ('SCZ-NORTE', 'Sucursal Santa Cruz Norte', NULL, NULL, 'Zona Norte, Santa Cruz de la Sierra', 'Santa Cruz de la Sierra', 'Santa Cruz', 'Bolivia', 'Lunes a viernes 08:00-21:00; sábado 08:00-13:00', 22, 16, 'Activo'),
  ('SCZ-SUR', 'Sucursal Santa Cruz Sur', NULL, NULL, 'Zona Sur, Santa Cruz de la Sierra', 'Santa Cruz de la Sierra', 'Santa Cruz', 'Bolivia', 'Lunes a viernes 08:00-21:00; sábado 08:00-13:00', 20, 14, 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, telefono=EXCLUDED.telefono, email=EXCLUDED.email, direccion_linea1=EXCLUDED.direccion_linea1, ciudad=EXCLUDED.ciudad, departamento=EXCLUDED.departamento, pais=EXCLUDED.pais, horario_texto=EXCLUDED.horario_texto, largo_m=EXCLUDED.largo_m, ancho_m=EXCLUDED.ancho_m, estado_registro=EXCLUDED.estado_registro, fecha_modificacion=NOW(), version_registro=COALESCE(infraestructura.sucursal.version_registro,1)+1;

-- Edificios base
INSERT INTO infraestructura.edificio (id_sucursal, codigo, nombre, direccion_linea1, ciudad, departamento, pais, pisos, largo_m, ancho_m, estado_registro)
VALUES
  ((SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), 'EDIF-CENTRO-01', 'Edificio Académico Centro', 'Zona Centro, Santa Cruz de la Sierra', 'Santa Cruz de la Sierra', 'Santa Cruz', 'Bolivia', 3, 25, 18, 'Activo'),
  ((SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-NORTE'), 'EDIF-NORTE-01', 'Edificio Académico Norte', 'Zona Norte, Santa Cruz de la Sierra', 'Santa Cruz de la Sierra', 'Santa Cruz', 'Bolivia', 2, 22, 16, 'Activo')
ON CONFLICT (id_sucursal, codigo) DO UPDATE SET nombre=EXCLUDED.nombre, direccion_linea1=EXCLUDED.direccion_linea1, ciudad=EXCLUDED.ciudad, departamento=EXCLUDED.departamento, pais=EXCLUDED.pais, pisos=EXCLUDED.pisos, largo_m=EXCLUDED.largo_m, ancho_m=EXCLUDED.ancho_m, estado_registro=EXCLUDED.estado_registro, fecha_modificacion=NOW(), version_registro=COALESCE(infraestructura.edificio.version_registro,1)+1;

INSERT INTO infraestructura.espacio (id_edificio, tipo, categoria_sala, tipo_aula, es_privada, nombre, piso, capacidad, largo_m, ancho_m, observaciones, estado_registro)
SELECT (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01'), 'AULA'::infraestructura.tipo_espacio, NULL::infraestructura.categoria_sala, 'TEORIA'::infraestructura.tipo_aula, FALSE, 'Aula Teoría 101', 1, 30, 7, 6, 'Aula estándar para clases grupales', 'Activo'
WHERE NOT EXISTS (
  SELECT 1 FROM infraestructura.espacio esp
  WHERE esp.id_edificio = (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01')
    AND esp.nombre = 'Aula Teoría 101'
);
INSERT INTO infraestructura.espacio (id_edificio, tipo, categoria_sala, tipo_aula, es_privada, nombre, piso, capacidad, largo_m, ancho_m, observaciones, estado_registro)
SELECT (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01'), 'AULA'::infraestructura.tipo_espacio, NULL::infraestructura.categoria_sala, 'COMPUTACION'::infraestructura.tipo_aula, FALSE, 'Laboratorio Computación 201', 2, 24, 8, 6, 'Aula con equipos', 'Activo'
WHERE NOT EXISTS (
  SELECT 1 FROM infraestructura.espacio esp
  WHERE esp.id_edificio = (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01')
    AND esp.nombre = 'Laboratorio Computación 201'
);
INSERT INTO infraestructura.espacio (id_edificio, tipo, categoria_sala, tipo_aula, es_privada, nombre, piso, capacidad, largo_m, ancho_m, observaciones, estado_registro)
SELECT (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01'), 'SALA'::infraestructura.tipo_espacio, 'TIENDA'::infraestructura.categoria_sala, NULL::infraestructura.tipo_aula, FALSE, 'Tienda Centro', 1, 10, 5, 4, 'Espacio comercial', 'Activo'
WHERE NOT EXISTS (
  SELECT 1 FROM infraestructura.espacio esp
  WHERE esp.id_edificio = (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01')
    AND esp.nombre = 'Tienda Centro'
);
INSERT INTO infraestructura.espacio (id_edificio, tipo, categoria_sala, tipo_aula, es_privada, nombre, piso, capacidad, largo_m, ancho_m, observaciones, estado_registro)
SELECT (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01'), 'SALA'::infraestructura.tipo_espacio, 'OFICINA'::infraestructura.categoria_sala, NULL::infraestructura.tipo_aula, TRUE, 'Oficina Contabilidad', 2, 6, 5, 4, 'Área administrativa contable', 'Activo'
WHERE NOT EXISTS (
  SELECT 1 FROM infraestructura.espacio esp
  WHERE esp.id_edificio = (SELECT id_edificio FROM infraestructura.edificio WHERE codigo='EDIF-CENTRO-01')
    AND esp.nombre = 'Oficina Contabilidad'
);

-- Tiendas base
INSERT INTO infraestructura.tienda (id_espacio, codigo, nombre, horario_texto, id_responsable, estado_registro)
VALUES
  ((SELECT id_espacio FROM infraestructura.espacio WHERE nombre='Tienda Centro' LIMIT 1), 'TIE-CENTRO', 'Tienda Académica Centro', 'Lunes a viernes 08:00-20:00; sábado 08:00-13:00', (SELECT id_persona FROM persona.persona_usuario WHERE nombre_usuario='pablo.admin'), 'Activo')
ON CONFLICT (codigo) DO UPDATE SET id_espacio=EXCLUDED.id_espacio, nombre=EXCLUDED.nombre, horario_texto=EXCLUDED.horario_texto, id_responsable=EXCLUDED.id_responsable, estado_registro=EXCLUDED.estado_registro, fecha_modificacion=NOW(), version_registro=COALESCE(infraestructura.tienda.version_registro,1)+1;

INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('DIR-GRAL', 'Dirección General', 'Gobierno general, estrategia, control de gestión y toma de decisiones ejecutivas', NULL, (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('FIN-CONT', 'Finanzas y Contabilidad', 'Contabilidad, EEFF, caja, costos, conciliaciones y reportes financieros', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('ADM-RRHH', 'Administración y RRHH', 'Gestión administrativa, empleados, nómina y soporte interno', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('ACAD', 'Académico', 'Cursos, clases, tutores, materias, asistencia y calidad académica', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('COM-MKT', 'Comercial y Marketing', 'Ventas, publicidad, captación, convenios y crecimiento comercial', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('OPS-TIENDA', 'Operaciones de Tienda', 'Venta de productos, reposición, atención y caja de tienda', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('LOG-INV', 'Logística e Inventario', 'Almacén, movimientos, lotes, kardex y control de activos', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('TI', 'Tecnología', 'Soporte de sistemas, infraestructura digital y seguridad de accesos', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;
INSERT INTO administracion.departamento (codigo, nombre, descripcion_funciones, id_departamento_padre, id_sucursal, es_activo, fecha_inicio, estado_registro)
VALUES ('LEGAL-SOC', 'Legal y Societario', 'Documentación societaria, títulos, titulares, dividendos y cumplimiento legal', (SELECT id_departamento FROM administracion.departamento WHERE codigo='DIR-GRAL'), (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), TRUE, '2026-01-01', 'Activo')
ON CONFLICT (id_sucursal, nombre) DO UPDATE SET codigo=EXCLUDED.codigo, descripcion_funciones=EXCLUDED.descripcion_funciones, id_departamento_padre=EXCLUDED.id_departamento_padre, es_activo=EXCLUDED.es_activo, fecha_inicio=EXCLUDED.fecha_inicio, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.departamento.version_registro,1)+1;

INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('CEO', 'Director General', NULL, 'Responsable máximo del negocio', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('CONT-GRAL', 'Contador General', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Responsable de contabilidad, EEFF, impuestos, costos y control financiero', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('AUX-CONT', 'Auxiliar Contable', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CONT-GRAL'), 'Apoyo en registro y conciliación contable', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('CAJERO', 'Cajero', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CONT-GRAL'), 'Registro de cobros/pagos y documentación de caja', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('DIR-ACAD', 'Director Académico', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Responsable del servicio educativo', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('COORD-ACAD', 'Coordinador Académico', (SELECT id_posicion FROM administracion.posicion WHERE codigo='DIR-ACAD'), 'Coordina horarios, clases, tutores y asistencia', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('TUTOR', 'Tutor Docente', (SELECT id_posicion FROM administracion.posicion WHERE codigo='COORD-ACAD'), 'Dicta clases y registra asistencia', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('ENC-TIENDA', 'Encargado de Tienda', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Responsable de tienda física y operaciones comerciales', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('AUX-INV', 'Auxiliar de Inventario', (SELECT id_posicion FROM administracion.posicion WHERE codigo='ENC-TIENDA'), 'Control de stock, lotes y movimientos', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('RRHH', 'Responsable de RRHH', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Gestión de empleados, cargos y pagos laborales', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('SOP-TI', 'Soporte TI', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Soporte de usuarios, sesiones e incidencias', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;
INSERT INTO administracion.posicion (codigo, nombre, id_posicion_parent, descripcion, estado_registro)
VALUES ('LEGAL', 'Responsable Legal Societario', (SELECT id_posicion FROM administracion.posicion WHERE codigo='CEO'), 'Control societario y documentación legal', 'Activo')
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, id_posicion_parent=EXCLUDED.id_posicion_parent, descripcion=EXCLUDED.descripcion, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.posicion.version_registro,1)+1;

INSERT INTO administracion.empleado (id_persona, fecha_ingreso, tipo_contrato, jornada, email_corporativo, id_sucursal, estado_registro)
VALUES (900001, '2026-01-01', 'INDEFINIDO'::administracion.tipo_contrato, 'FULL_TIME'::administracion.jornada_laboral, NULL, (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET fecha_ingreso=EXCLUDED.fecha_ingreso, tipo_contrato=EXCLUDED.tipo_contrato, jornada=EXCLUDED.jornada, email_corporativo=EXCLUDED.email_corporativo, id_sucursal=EXCLUDED.id_sucursal, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.empleado.version_registro,1)+1;
INSERT INTO administracion.empleado (id_persona, fecha_ingreso, tipo_contrato, jornada, email_corporativo, id_sucursal, estado_registro)
VALUES (900002, '2026-01-01', 'INDEFINIDO'::administracion.tipo_contrato, 'FULL_TIME'::administracion.jornada_laboral, NULL, (SELECT id_sucursal FROM infraestructura.sucursal WHERE codigo='SCZ-CENTRO'), 'Activo')
ON CONFLICT (id_persona) DO UPDATE SET fecha_ingreso=EXCLUDED.fecha_ingreso, tipo_contrato=EXCLUDED.tipo_contrato, jornada=EXCLUDED.jornada, email_corporativo=EXCLUDED.email_corporativo, id_sucursal=EXCLUDED.id_sucursal, estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(administracion.empleado.version_registro,1)+1;

INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Ingresos netos mensuales', 'Ingresos netos por servicios educativos y tienda', 'BOB', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Ingresos netos mensuales');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Margen bruto por línea', 'Margen bruto por clases, cursos, paquetes y tienda', '%', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Margen bruto por línea');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Utilidad operativa', 'Resultado operativo antes de impuestos y financiamiento', 'BOB', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Utilidad operativa');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Asistencia promedio por curso', 'Porcentaje de asistencia promedio por curso y materia', '%', 'SEMANAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Asistencia promedio por curso');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Ocupación de aulas', 'Uso de aulas disponibles frente a capacidad operativa', '%', 'SEMANAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Ocupación de aulas');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Rotación de inventario tienda', 'Veces que rota el stock de productos de tienda', 'veces', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Rotación de inventario tienda');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'Cartera vencida', 'Monto o porcentaje de cuentas por cobrar vencidas', '%', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='Cartera vencida');
INSERT INTO administracion.kpi (nombre, descripcion, unidad_medida, frecuencia, estado_registro)
SELECT 'NPS académico', 'Satisfacción recomendación de estudiantes/padres', 'puntos', 'MENSUAL', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM administracion.kpi WHERE nombre='NPS académico');

INSERT INTO persona.unidad_educativa (nombre, latitud, longitud, categoria, estado_registro)
SELECT 'Colegio Particular Referencial', NULL, NULL, 'privada', TRUE
WHERE NOT EXISTS (SELECT 1 FROM persona.unidad_educativa WHERE nombre='Colegio Particular Referencial');
INSERT INTO persona.unidad_educativa (nombre, latitud, longitud, categoria, estado_registro)
SELECT 'Universidad Referencial', NULL, NULL, 'privada', TRUE
WHERE NOT EXISTS (SELECT 1 FROM persona.unidad_educativa WHERE nombre='Universidad Referencial');
INSERT INTO persona.unidad_educativa (nombre, latitud, longitud, categoria, estado_registro)
SELECT 'Unidad Educativa Fiscal Referencial', NULL, NULL, 'fiscal', TRUE
WHERE NOT EXISTS (SELECT 1 FROM persona.unidad_educativa WHERE nombre='Unidad Educativa Fiscal Referencial');

INSERT INTO persona.proveedor (nombre_proveedor, categoria, telefono, estado_registro)
SELECT 'Proveedor Material Educativo Referencial', 'Materiales educativos', NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM persona.proveedor WHERE nombre_proveedor='Proveedor Material Educativo Referencial');
INSERT INTO persona.proveedor (nombre_proveedor, categoria, telefono, estado_registro)
SELECT 'Proveedor Impresión y Papelería Referencial', 'Papelería e imprenta', NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM persona.proveedor WHERE nombre_proveedor='Proveedor Impresión y Papelería Referencial');
INSERT INTO persona.proveedor (nombre_proveedor, categoria, telefono, estado_registro)
SELECT 'Proveedor Tecnología Referencial', 'Tecnología y licencias', NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM persona.proveedor WHERE nombre_proveedor='Proveedor Tecnología Referencial');
INSERT INTO persona.proveedor (nombre_proveedor, categoria, telefono, estado_registro)
SELECT 'Proveedor Mobiliario Referencial', 'Mobiliario e infraestructura', NULL, 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM persona.proveedor WHERE nombre_proveedor='Proveedor Mobiliario Referencial');

-- Clases de título societario base
INSERT INTO societario.clase_titulo (tipo, sub_tipo, descripcion, valor_nominal, derechos_voto_por_titulo, prioridad_dividendo_bp, pref_liquidacion_x, es_convertible, es_participante, estado_registro)
VALUES
  ('CUOTA', 'CUOTA_ORDINARIA', 'Cuotas de capital ordinarias de sociedad comercial', 100, 1, NULL, NULL, FALSE, FALSE, 'Activo'),
  ('ACCION', 'ACCION_ORDINARIA', 'Acciones ordinarias para estructura societaria futura', 100, 1, NULL, NULL, FALSE, FALSE, 'Activo')
ON CONFLICT (tipo, sub_tipo) DO UPDATE SET descripcion=EXCLUDED.descripcion, valor_nominal=EXCLUDED.valor_nominal, derechos_voto_por_titulo=EXCLUDED.derechos_voto_por_titulo, prioridad_dividendo_bp=EXCLUDED.prioridad_dividendo_bp, pref_liquidacion_x=EXCLUDED.pref_liquidacion_x, es_convertible=EXCLUDED.es_convertible, es_participante=EXCLUDED.es_participante, estado_registro=EXCLUDED.estado_registro, fecha_modificacion=NOW(), version_registro=COALESCE(societario.clase_titulo.version_registro,1)+1;

-- Asignación de permisos por rol
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r CROSS JOIN seguridad.permiso p
WHERE r.codigo = 'SUPER_ADMIN'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.EDITAR','ACADEMICO.ASISTENCIA.EXPORTAR','ACADEMICO.ASISTENCIA.REGISTRAR','ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.CANCELAR','ACADEMICO.CLASES.EDITAR','ACADEMICO.CLASES.EXPORTAR','ACADEMICO.CLASES.REGISTRAR','ACADEMICO.CLASES.VER','ACADEMICO.CLASE_CURSO.CANCELAR','ACADEMICO.CLASE_CURSO.CREAR','ACADEMICO.CLASE_CURSO.EDITAR','ACADEMICO.CLASE_CURSO.VER','ACADEMICO.CLASE_POR_HORA.ANULAR','ACADEMICO.CLASE_POR_HORA.CERRAR','ACADEMICO.CLASE_POR_HORA.CREAR','ACADEMICO.CLASE_POR_HORA.EDITAR','ACADEMICO.CLASE_POR_HORA.VER','ACADEMICO.CURSOS.CREAR','ACADEMICO.CURSOS.DESACTIVAR','ACADEMICO.CURSOS.EDITAR','ACADEMICO.CURSOS.GESTIONAR','ACADEMICO.CURSOS.VER','ACADEMICO.CURSO_VERSION.CREAR','ACADEMICO.CURSO_VERSION.DESACTIVAR','ACADEMICO.CURSO_VERSION.EDITAR','ACADEMICO.CURSO_VERSION.VER','ACADEMICO.HORARIOS.CREAR','ACADEMICO.HORARIOS.DESACTIVAR','ACADEMICO.HORARIOS.EDITAR','ACADEMICO.HORARIOS.GESTIONAR','ACADEMICO.HORARIOS.VER','ACADEMICO.MATERIA_TREE.CREAR','ACADEMICO.MATERIA_TREE.DESACTIVAR','ACADEMICO.MATERIA_TREE.EDITAR','ACADEMICO.MATERIA_TREE.IMPORTAR','ACADEMICO.MATERIA_TREE.VER','ACADEMICO.PAQUETES.CREAR','ACADEMICO.PAQUETES.DESACTIVAR','ACADEMICO.PAQUETES.EDITAR','ACADEMICO.PAQUETES.GESTIONAR','ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.CREAR','ACADEMICO.PRODUCTO.DESACTIVAR','ACADEMICO.PRODUCTO.EDITAR','ACADEMICO.PRODUCTO.GESTIONAR','ACADEMICO.PRODUCTO.VER','ACADEMICO.PRODUCTO_EDUCATIVO.CREAR','ACADEMICO.PRODUCTO_EDUCATIVO.DESACTIVAR','ACADEMICO.PRODUCTO_EDUCATIVO.EDITAR','ACADEMICO.PRODUCTO_EDUCATIVO.VER','ADMIN.DEPARTAMENTO.CREAR','ADMIN.DEPARTAMENTO.DESACTIVAR','ADMIN.DEPARTAMENTO.EDITAR','ADMIN.DEPARTAMENTO.GESTIONAR','ADMIN.DEPARTAMENTO.VER','ADMIN.EMPLEADO.CREAR','ADMIN.EMPLEADO.DESACTIVAR','ADMIN.EMPLEADO.EDITAR','ADMIN.EMPLEADO.EXPORTAR','ADMIN.EMPLEADO.GESTIONAR','ADMIN.EMPLEADO.VER','ADMIN.EMPLEADO_POSICION_PAGO.CREAR','ADMIN.EMPLEADO_POSICION_PAGO.DESACTIVAR','ADMIN.EMPLEADO_POSICION_PAGO.EDITAR','ADMIN.EMPLEADO_POSICION_PAGO.VER','ADMIN.EMPLEADO_REGISTRO_PAGO.ANULAR','ADMIN.EMPLEADO_REGISTRO_PAGO.CREAR','ADMIN.EMPLEADO_REGISTRO_PAGO.EDITAR','ADMIN.EMPLEADO_REGISTRO_PAGO.EXPORTAR','ADMIN.EMPLEADO_REGISTRO_PAGO.VER','ADMIN.KPI.CREAR','ADMIN.KPI.DESACTIVAR','ADMIN.KPI.EDITAR','ADMIN.KPI.GESTIONAR','ADMIN.KPI.VER','ADMIN.NOMINA.EXPORTAR','ADMIN.NOMINA.GESTIONAR','ADMIN.NOMINA.VER','ADMIN.OBJETIVO_KPI.CREAR','ADMIN.OBJETIVO_KPI.DESACTIVAR','ADMIN.OBJETIVO_KPI.EDITAR','ADMIN.OBJETIVO_KPI.VER','ADMIN.POSICION.CREAR','ADMIN.POSICION.DESACTIVAR','ADMIN.POSICION.EDITAR','ADMIN.POSICION.GESTIONAR','ADMIN.POSICION.VER','AUDITORIA.CAMBIOS_CRITICOS.EXPORTAR','AUDITORIA.CAMBIOS_CRITICOS.VER','AUDITORIA.PERMISOS_EFECTIVOS.EXPORTAR','AUDITORIA.PERMISOS_EFECTIVOS.VER','AUDITORIA.TRAZABILIDAD.EXPORTAR','AUDITORIA.TRAZABILIDAD.VER','CAJA.COBRANZA.EXPORTAR','CAJA.COBRANZA.GESTIONAR','CAJA.COBRANZA.VER','CAJA.DEUDA.ANULAR','CAJA.DEUDA.CREAR','CAJA.DEUDA.EDITAR','CAJA.DEUDA.EXPORTAR','CAJA.DEUDA.VER','CAJA.PAGO.ANULAR','CAJA.PAGO.EDITAR','CAJA.PAGO.EXPORTAR','CAJA.PAGO.REGISTRAR','CAJA.PAGO.VER','CAJA.RECIBOS.ANULAR','CAJA.RECIBOS.EMITIR','CAJA.RECIBOS.EXPORTAR','CAJA.RECIBOS.VER','CONFIG.CATALOGOS.GESTIONAR','CONFIG.CATALOGOS.VER','CONFIG.MAPEOS_CONTABLES.GESTIONAR','CONFIG.MAPEOS_CONTABLES.VER','CONFIG.PARAMETROS_NEGOCIO.VER','CONTAB.ARCHIVOS_TRANSACCION.ELIMINAR','CONTAB.ARCHIVOS_TRANSACCION.SUBIR','CONTAB.ARCHIVOS_TRANSACCION.VER','CONTAB.CENTRO_COSTO.CREAR','CONTAB.CENTRO_COSTO.DESACTIVAR','CONTAB.CENTRO_COSTO.EDITAR','CONTAB.CENTRO_COSTO.GESTIONAR','CONTAB.CENTRO_COSTO.VER','CONTAB.CENTRO_COSTO_MAPA.CREAR','CONTAB.CENTRO_COSTO_MAPA.DESACTIVAR','CONTAB.CENTRO_COSTO_MAPA.EDITAR','CONTAB.CENTRO_COSTO_MAPA.VER','CONTAB.CIERRE_PERIODO.APROBAR','CONTAB.CIERRE_PERIODO.EJECUTAR','CONTAB.CIERRE_PERIODO.REVERTIR','CONTAB.CIERRE_PERIODO.VER','CONTAB.CONCEPTO_COSTO.CREAR','CONTAB.CONCEPTO_COSTO.DESACTIVAR','CONTAB.CONCEPTO_COSTO.EDITAR','CONTAB.CONCEPTO_COSTO.VER','CONTAB.CONCILIACION.APROBAR','CONTAB.CONCILIACION.GESTIONAR','CONTAB.CONCILIACION.VER','CONTAB.CUENTA.CREAR','CONTAB.CUENTA.DESACTIVAR','CONTAB.CUENTA.EDITAR','CONTAB.CUENTA.EXPORTAR','CONTAB.CUENTA.GESTIONAR','CONTAB.CUENTA.VER','CONTAB.CUENTAS.GESTIONAR','CONTAB.CUENTAS.VER','CONTAB.CUENTA_ASIGNACION.CREAR','CONTAB.CUENTA_ASIGNACION.DESACTIVAR','CONTAB.CUENTA_ASIGNACION.EDITAR','CONTAB.CUENTA_ASIGNACION.VER','CONTAB.EEFF.EXPORTAR','CONTAB.EEFF.GENERAR','CONTAB.EEFF.VER','CONTAB.GRUPO_CUENTA.CREAR','CONTAB.GRUPO_CUENTA.DESACTIVAR','CONTAB.GRUPO_CUENTA.EDITAR','CONTAB.GRUPO_CUENTA.VER','CONTAB.LIBRO_DIARIO.EXPORTAR','CONTAB.LIBRO_DIARIO.VER','CONTAB.LIBRO_MAYOR.EXPORTAR','CONTAB.LIBRO_MAYOR.VER','CONTAB.MOVIMIENTO_CUENTA.ANULAR','CONTAB.MOVIMIENTO_CUENTA.EDITAR','CONTAB.MOVIMIENTO_CUENTA.REGISTRAR','CONTAB.MOVIMIENTO_CUENTA.VER','CONTAB.PAGO_TUTOR.ANULAR','CONTAB.PAGO_TUTOR.APROBAR','CONTAB.PAGO_TUTOR.GESTIONAR','CONTAB.PAGO_TUTOR.VER','CONTAB.TRANSACCION.ANULAR','CONTAB.TRANSACCION.APROBAR','CONTAB.TRANSACCION.EDITAR','CONTAB.TRANSACCION.EXPORTAR','CONTAB.TRANSACCION.REGISTRAR','CONTAB.TRANSACCION.VER','INFRA.EDIFICIO.CREAR','INFRA.EDIFICIO.DESACTIVAR','INFRA.EDIFICIO.EDITAR','INFRA.EDIFICIO.VER','INFRA.ENCARGADO.CREAR','INFRA.ENCARGADO.DESACTIVAR','INFRA.ENCARGADO.EDITAR','INFRA.ENCARGADO.VER','INFRA.ESPACIO.CREAR','INFRA.ESPACIO.DESACTIVAR','INFRA.ESPACIO.EDITAR','INFRA.ESPACIO.VER','INFRA.SUCURSAL.CREAR','INFRA.SUCURSAL.DESACTIVAR','INFRA.SUCURSAL.EDITAR','INFRA.SUCURSAL.VER','INFRA.TIENDA.CREAR','INFRA.TIENDA.DESACTIVAR','INFRA.TIENDA.EDITAR','INFRA.TIENDA.VER','INV.BIEN.CREAR','INV.BIEN.DESACTIVAR','INV.BIEN.EDITAR','INV.BIEN.EXPORTAR','INV.BIEN.GESTIONAR','INV.BIEN.VER','INV.BIEN_INSTANCIA.CREAR','INV.BIEN_INSTANCIA.DESACTIVAR','INV.BIEN_INSTANCIA.EDITAR','INV.BIEN_INSTANCIA.VER','INV.BIEN_LOTE.CREAR','INV.BIEN_LOTE.DESACTIVAR','INV.BIEN_LOTE.EDITAR','INV.BIEN_LOTE.VER','INV.DEPRECIACION.EJECUTAR','INV.DEPRECIACION.EXPORTAR','INV.DEPRECIACION.VER','INV.KARDEX.EXPORTAR','INV.KARDEX.VER','INV.MOVIMIENTO.ANULAR','INV.MOVIMIENTO.EDITAR','INV.MOVIMIENTO.REGISTRAR','INV.MOVIMIENTO.VER','INV.MOVIMIENTO_DETALLE.ANULAR','INV.MOVIMIENTO_DETALLE.EDITAR','INV.MOVIMIENTO_DETALLE.REGISTRAR','INV.MOVIMIENTO_DETALLE.VER','INV.VALUACION.EJECUTAR','INV.VALUACION.EXPORTAR','INV.VALUACION.VER','PERSONA.ESTUDIANTE.CREAR','PERSONA.ESTUDIANTES.CREAR','PERSONA.ESTUDIANTES.DESACTIVAR','PERSONA.ESTUDIANTES.EDITAR','PERSONA.ESTUDIANTES.EXPORTAR','PERSONA.ESTUDIANTES.VER','PERSONA.ESTUDIANTE_PADRE.GESTIONAR','PERSONA.ESTUDIANTE_PADRE.VER','PERSONA.PADRE.CREAR','PERSONA.PADRES.CREAR','PERSONA.PADRES.DESACTIVAR','PERSONA.PADRES.EDITAR','PERSONA.PADRES.EXPORTAR','PERSONA.PADRES.VER','PERSONA.PERSONAS.CREAR','PERSONA.PERSONAS.DESACTIVAR','PERSONA.PERSONAS.EDITAR','PERSONA.PERSONAS.EXPORTAR','PERSONA.PERSONAS.VER','PERSONA.PROVEEDORES.CREAR','PERSONA.PROVEEDORES.DESACTIVAR','PERSONA.PROVEEDORES.EDITAR','PERSONA.PROVEEDORES.EXPORTAR','PERSONA.PROVEEDORES.VER','PERSONA.TUTOR.CREAR','PERSONA.TUTORES.CREAR','PERSONA.TUTORES.DESACTIVAR','PERSONA.TUTORES.EDITAR','PERSONA.TUTORES.EXPORTAR','PERSONA.TUTORES.VER','PERSONA.UNIDAD_EDUCATIVA.CREAR','PERSONA.UNIDAD_EDUCATIVA.DESACTIVAR','PERSONA.UNIDAD_EDUCATIVA.EDITAR','PERSONA.UNIDAD_EDUCATIVA.EXPORTAR','PERSONA.UNIDAD_EDUCATIVA.VER','PERSONA.USUARIOS.VER','REPORTES.ACADEMICOS.EXPORTAR','REPORTES.ACADEMICOS.GENERAR','REPORTES.ACADEMICOS.VER','REPORTES.COMERCIALES.EXPORTAR','REPORTES.COMERCIALES.GENERAR','REPORTES.COMERCIALES.VER','REPORTES.EJECUTIVO.EXPORTAR','REPORTES.EJECUTIVO.GENERAR','REPORTES.EJECUTIVO.VER','REPORTES.FINANCIEROS.EXPORTAR','REPORTES.FINANCIEROS.GENERAR','REPORTES.FINANCIEROS.VER','REPORTES.INVENTARIO.EXPORTAR','REPORTES.INVENTARIO.GENERAR','REPORTES.INVENTARIO.VER','REPORTES.RRHH.EXPORTAR','REPORTES.RRHH.GENERAR','REPORTES.RRHH.VER','SISTEMA.LOGS.EXPORTAR','SISTEMA.LOGS.VER','SISTEMA.PERMISOS.GESTIONAR','SISTEMA.PERMISOS.VER','SISTEMA.ROLES.CREAR','SISTEMA.ROLES.DESACTIVAR','SISTEMA.ROLES.EDITAR','SISTEMA.ROLES.GESTIONAR','SISTEMA.ROLES.VER','SISTEMA.SESIONES.CERRAR','SISTEMA.SESIONES.VER','SISTEMA.TOKEN_ACCION.VER','SISTEMA.USUARIOS.ASIGNAR_ROL','SISTEMA.USUARIOS.CREAR','SISTEMA.USUARIOS.DESACTIVAR','SISTEMA.USUARIOS.EDITAR','SISTEMA.USUARIOS.EXPORTAR','SISTEMA.USUARIOS.RESET_PASSWORD','SISTEMA.USUARIOS.VER','SOC.CLASE_TITULO.CREAR','SOC.CLASE_TITULO.DESACTIVAR','SOC.CLASE_TITULO.EDITAR','SOC.CLASE_TITULO.VER','SOC.DIVIDENDO.ANULAR','SOC.DIVIDENDO.APROBAR','SOC.DIVIDENDO.CREAR','SOC.DIVIDENDO.VER','SOC.DIVIDENDO_PAGO.ANULAR','SOC.DIVIDENDO_PAGO.REGISTRAR','SOC.DIVIDENDO_PAGO.VER','SOC.EMISION_TITULO.ANULAR','SOC.EMISION_TITULO.CREAR','SOC.EMISION_TITULO.EDITAR','SOC.EMISION_TITULO.VER','SOC.TENENCIA.AJUSTAR','SOC.TENENCIA.CREAR','SOC.TENENCIA.EDITAR','SOC.TENENCIA.VER','SOC.TITULAR.CREAR','SOC.TITULAR.DESACTIVAR','SOC.TITULAR.EDITAR','SOC.TITULAR.VER','SOC.TITULOS.GESTIONAR','SOC.TITULOS.VER','SOC.TRANSFERENCIA_TITULO.ANULAR','SOC.TRANSFERENCIA_TITULO.CREAR','SOC.TRANSFERENCIA_TITULO.VER'])
WHERE r.codigo = 'ADMIN_GENERAL'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ADMIN.DEPARTAMENTO.VER','ADMIN.EMPLEADO.EXPORTAR','ADMIN.EMPLEADO.VER','ADMIN.EMPLEADO_POSICION_PAGO.VER','ADMIN.EMPLEADO_REGISTRO_PAGO.EXPORTAR','ADMIN.EMPLEADO_REGISTRO_PAGO.VER','ADMIN.POSICION.VER','AUDITORIA.TRAZABILIDAD.EXPORTAR','AUDITORIA.TRAZABILIDAD.VER','CAJA.COBRANZA.EXPORTAR','CAJA.COBRANZA.GESTIONAR','CAJA.COBRANZA.VER','CAJA.DEUDA.ANULAR','CAJA.DEUDA.CREAR','CAJA.DEUDA.EDITAR','CAJA.DEUDA.EXPORTAR','CAJA.DEUDA.VER','CAJA.PAGO.ANULAR','CAJA.PAGO.EDITAR','CAJA.PAGO.EXPORTAR','CAJA.PAGO.REGISTRAR','CAJA.PAGO.VER','CAJA.RECIBOS.ANULAR','CAJA.RECIBOS.EMITIR','CAJA.RECIBOS.EXPORTAR','CAJA.RECIBOS.VER','CONTAB.ARCHIVOS_TRANSACCION.ELIMINAR','CONTAB.ARCHIVOS_TRANSACCION.SUBIR','CONTAB.ARCHIVOS_TRANSACCION.VER','CONTAB.CENTRO_COSTO.CREAR','CONTAB.CENTRO_COSTO.DESACTIVAR','CONTAB.CENTRO_COSTO.EDITAR','CONTAB.CENTRO_COSTO.GESTIONAR','CONTAB.CENTRO_COSTO.VER','CONTAB.CENTRO_COSTO_MAPA.CREAR','CONTAB.CENTRO_COSTO_MAPA.DESACTIVAR','CONTAB.CENTRO_COSTO_MAPA.EDITAR','CONTAB.CENTRO_COSTO_MAPA.VER','CONTAB.CIERRE_PERIODO.APROBAR','CONTAB.CIERRE_PERIODO.EJECUTAR','CONTAB.CIERRE_PERIODO.REVERTIR','CONTAB.CIERRE_PERIODO.VER','CONTAB.CONCEPTO_COSTO.CREAR','CONTAB.CONCEPTO_COSTO.DESACTIVAR','CONTAB.CONCEPTO_COSTO.EDITAR','CONTAB.CONCEPTO_COSTO.VER','CONTAB.CONCILIACION.APROBAR','CONTAB.CONCILIACION.GESTIONAR','CONTAB.CONCILIACION.VER','CONTAB.CUENTA.CREAR','CONTAB.CUENTA.DESACTIVAR','CONTAB.CUENTA.EDITAR','CONTAB.CUENTA.EXPORTAR','CONTAB.CUENTA.GESTIONAR','CONTAB.CUENTA.VER','CONTAB.CUENTAS.GESTIONAR','CONTAB.CUENTAS.VER','CONTAB.CUENTA_ASIGNACION.CREAR','CONTAB.CUENTA_ASIGNACION.DESACTIVAR','CONTAB.CUENTA_ASIGNACION.EDITAR','CONTAB.CUENTA_ASIGNACION.VER','CONTAB.EEFF.EXPORTAR','CONTAB.EEFF.GENERAR','CONTAB.EEFF.VER','CONTAB.GRUPO_CUENTA.CREAR','CONTAB.GRUPO_CUENTA.DESACTIVAR','CONTAB.GRUPO_CUENTA.EDITAR','CONTAB.GRUPO_CUENTA.VER','CONTAB.LIBRO_DIARIO.EXPORTAR','CONTAB.LIBRO_DIARIO.VER','CONTAB.LIBRO_MAYOR.EXPORTAR','CONTAB.LIBRO_MAYOR.VER','CONTAB.MOVIMIENTO_CUENTA.ANULAR','CONTAB.MOVIMIENTO_CUENTA.EDITAR','CONTAB.MOVIMIENTO_CUENTA.REGISTRAR','CONTAB.MOVIMIENTO_CUENTA.VER','CONTAB.PAGO_TUTOR.ANULAR','CONTAB.PAGO_TUTOR.APROBAR','CONTAB.PAGO_TUTOR.GESTIONAR','CONTAB.PAGO_TUTOR.VER','CONTAB.TRANSACCION.ANULAR','CONTAB.TRANSACCION.APROBAR','CONTAB.TRANSACCION.EDITAR','CONTAB.TRANSACCION.EXPORTAR','CONTAB.TRANSACCION.REGISTRAR','CONTAB.TRANSACCION.VER','INV.BIEN.EXPORTAR','INV.BIEN.VER','INV.BIEN_INSTANCIA.VER','INV.BIEN_LOTE.VER','INV.DEPRECIACION.EXPORTAR','INV.DEPRECIACION.VER','INV.KARDEX.EXPORTAR','INV.KARDEX.VER','INV.MOVIMIENTO.VER','INV.MOVIMIENTO_DETALLE.VER','INV.VALUACION.EXPORTAR','INV.VALUACION.VER','PERSONA.ESTUDIANTES.EXPORTAR','PERSONA.ESTUDIANTES.VER','PERSONA.ESTUDIANTE_PADRE.VER','PERSONA.PADRES.EXPORTAR','PERSONA.PADRES.VER','PERSONA.PERSONAS.EXPORTAR','PERSONA.PERSONAS.VER','PERSONA.PROVEEDORES.EXPORTAR','PERSONA.PROVEEDORES.VER','PERSONA.TUTORES.EXPORTAR','PERSONA.TUTORES.VER','PERSONA.UNIDAD_EDUCATIVA.EXPORTAR','PERSONA.UNIDAD_EDUCATIVA.VER','PERSONA.USUARIOS.VER','REPORTES.FINANCIEROS.EXPORTAR','REPORTES.FINANCIEROS.GENERAR','REPORTES.FINANCIEROS.VER','REPORTES.INVENTARIO.EXPORTAR','REPORTES.INVENTARIO.GENERAR','REPORTES.INVENTARIO.VER','REPORTES.RRHH.EXPORTAR','REPORTES.RRHH.GENERAR','REPORTES.RRHH.VER','SISTEMA.LOGS.VER','SISTEMA.PERMISOS.VER','SISTEMA.ROLES.VER','SISTEMA.SESIONES.VER'])
WHERE r.codigo = 'CONTADOR_GENERAL'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['CAJA.COBRANZA.EXPORTAR','CAJA.COBRANZA.VER','CAJA.DEUDA.EXPORTAR','CAJA.DEUDA.VER','CAJA.PAGO.EXPORTAR','CAJA.PAGO.VER','CAJA.RECIBOS.EXPORTAR','CAJA.RECIBOS.VER','CONTAB.ARCHIVOS_TRANSACCION.SUBIR','CONTAB.ARCHIVOS_TRANSACCION.VER','CONTAB.CENTRO_COSTO.VER','CONTAB.CENTRO_COSTO_MAPA.VER','CONTAB.CIERRE_PERIODO.VER','CONTAB.CONCEPTO_COSTO.VER','CONTAB.CONCILIACION.VER','CONTAB.CUENTA.EXPORTAR','CONTAB.CUENTA.VER','CONTAB.CUENTAS.VER','CONTAB.CUENTA_ASIGNACION.VER','CONTAB.EEFF.EXPORTAR','CONTAB.EEFF.VER','CONTAB.GRUPO_CUENTA.VER','CONTAB.LIBRO_DIARIO.EXPORTAR','CONTAB.LIBRO_DIARIO.VER','CONTAB.LIBRO_MAYOR.EXPORTAR','CONTAB.LIBRO_MAYOR.VER','CONTAB.MOVIMIENTO_CUENTA.REGISTRAR','CONTAB.MOVIMIENTO_CUENTA.VER','CONTAB.PAGO_TUTOR.VER','CONTAB.TRANSACCION.EXPORTAR','CONTAB.TRANSACCION.REGISTRAR','CONTAB.TRANSACCION.VER','INV.BIEN.VER','PERSONA.ESTUDIANTES.VER','PERSONA.PROVEEDORES.VER','PERSONA.TUTORES.VER','REPORTES.FINANCIEROS.EXPORTAR','REPORTES.FINANCIEROS.VER'])
WHERE r.codigo = 'AUXILIAR_CONTABLE'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.VER','CAJA.COBRANZA.EXPORTAR','CAJA.COBRANZA.GESTIONAR','CAJA.COBRANZA.VER','CAJA.DEUDA.ANULAR','CAJA.DEUDA.CREAR','CAJA.DEUDA.EDITAR','CAJA.DEUDA.EXPORTAR','CAJA.DEUDA.VER','CAJA.PAGO.ANULAR','CAJA.PAGO.EDITAR','CAJA.PAGO.EXPORTAR','CAJA.PAGO.REGISTRAR','CAJA.PAGO.VER','CAJA.RECIBOS.ANULAR','CAJA.RECIBOS.EMITIR','CAJA.RECIBOS.EXPORTAR','CAJA.RECIBOS.VER','CONTAB.TRANSACCION.VER','PERSONA.ESTUDIANTES.VER','PERSONA.PADRES.VER','PERSONA.PERSONAS.VER'])
WHERE r.codigo = 'CAJERO'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.EDITAR','ACADEMICO.ASISTENCIA.EXPORTAR','ACADEMICO.ASISTENCIA.REGISTRAR','ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.CANCELAR','ACADEMICO.CLASES.EDITAR','ACADEMICO.CLASES.EXPORTAR','ACADEMICO.CLASES.REGISTRAR','ACADEMICO.CLASES.VER','ACADEMICO.CLASE_CURSO.CANCELAR','ACADEMICO.CLASE_CURSO.CREAR','ACADEMICO.CLASE_CURSO.EDITAR','ACADEMICO.CLASE_CURSO.VER','ACADEMICO.CLASE_POR_HORA.ANULAR','ACADEMICO.CLASE_POR_HORA.CERRAR','ACADEMICO.CLASE_POR_HORA.CREAR','ACADEMICO.CLASE_POR_HORA.EDITAR','ACADEMICO.CLASE_POR_HORA.VER','ACADEMICO.CURSOS.CREAR','ACADEMICO.CURSOS.DESACTIVAR','ACADEMICO.CURSOS.EDITAR','ACADEMICO.CURSOS.GESTIONAR','ACADEMICO.CURSOS.VER','ACADEMICO.CURSO_VERSION.CREAR','ACADEMICO.CURSO_VERSION.DESACTIVAR','ACADEMICO.CURSO_VERSION.EDITAR','ACADEMICO.CURSO_VERSION.VER','ACADEMICO.HORARIOS.CREAR','ACADEMICO.HORARIOS.DESACTIVAR','ACADEMICO.HORARIOS.EDITAR','ACADEMICO.HORARIOS.GESTIONAR','ACADEMICO.HORARIOS.VER','ACADEMICO.MATERIA_TREE.CREAR','ACADEMICO.MATERIA_TREE.DESACTIVAR','ACADEMICO.MATERIA_TREE.EDITAR','ACADEMICO.MATERIA_TREE.IMPORTAR','ACADEMICO.MATERIA_TREE.VER','ACADEMICO.PAQUETES.CREAR','ACADEMICO.PAQUETES.DESACTIVAR','ACADEMICO.PAQUETES.EDITAR','ACADEMICO.PAQUETES.GESTIONAR','ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.CREAR','ACADEMICO.PRODUCTO.DESACTIVAR','ACADEMICO.PRODUCTO.EDITAR','ACADEMICO.PRODUCTO.GESTIONAR','ACADEMICO.PRODUCTO.VER','ACADEMICO.PRODUCTO_EDUCATIVO.CREAR','ACADEMICO.PRODUCTO_EDUCATIVO.DESACTIVAR','ACADEMICO.PRODUCTO_EDUCATIVO.EDITAR','ACADEMICO.PRODUCTO_EDUCATIVO.VER','INFRA.EDIFICIO.CREAR','INFRA.EDIFICIO.DESACTIVAR','INFRA.EDIFICIO.EDITAR','INFRA.EDIFICIO.VER','INFRA.ESPACIO.CREAR','INFRA.ESPACIO.DESACTIVAR','INFRA.ESPACIO.EDITAR','INFRA.ESPACIO.VER','INFRA.SUCURSAL.CREAR','INFRA.SUCURSAL.DESACTIVAR','INFRA.SUCURSAL.EDITAR','INFRA.SUCURSAL.VER','PERSONA.ESTUDIANTES.CREAR','PERSONA.ESTUDIANTES.DESACTIVAR','PERSONA.ESTUDIANTES.EDITAR','PERSONA.ESTUDIANTES.VER','PERSONA.TUTORES.CREAR','PERSONA.TUTORES.DESACTIVAR','PERSONA.TUTORES.EDITAR','PERSONA.TUTORES.VER','PERSONA.UNIDAD_EDUCATIVA.CREAR','PERSONA.UNIDAD_EDUCATIVA.DESACTIVAR','PERSONA.UNIDAD_EDUCATIVA.EDITAR','PERSONA.UNIDAD_EDUCATIVA.VER','REPORTES.ACADEMICOS.EXPORTAR','REPORTES.ACADEMICOS.GENERAR','REPORTES.ACADEMICOS.VER'])
WHERE r.codigo = 'DIRECTOR_ACADEMICO'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.EDITAR','ACADEMICO.ASISTENCIA.EXPORTAR','ACADEMICO.ASISTENCIA.REGISTRAR','ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.CANCELAR','ACADEMICO.CLASES.EDITAR','ACADEMICO.CLASES.EXPORTAR','ACADEMICO.CLASES.REGISTRAR','ACADEMICO.CLASES.VER','ACADEMICO.CLASE_CURSO.CANCELAR','ACADEMICO.CLASE_CURSO.CREAR','ACADEMICO.CLASE_CURSO.EDITAR','ACADEMICO.CLASE_CURSO.VER','ACADEMICO.CLASE_POR_HORA.ANULAR','ACADEMICO.CLASE_POR_HORA.CERRAR','ACADEMICO.CLASE_POR_HORA.CREAR','ACADEMICO.CLASE_POR_HORA.EDITAR','ACADEMICO.CLASE_POR_HORA.VER','ACADEMICO.CURSOS.CREAR','ACADEMICO.CURSOS.EDITAR','ACADEMICO.CURSOS.GESTIONAR','ACADEMICO.CURSOS.VER','ACADEMICO.CURSO_VERSION.CREAR','ACADEMICO.CURSO_VERSION.EDITAR','ACADEMICO.CURSO_VERSION.VER','ACADEMICO.HORARIOS.CREAR','ACADEMICO.HORARIOS.EDITAR','ACADEMICO.HORARIOS.GESTIONAR','ACADEMICO.HORARIOS.VER','ACADEMICO.MATERIA_TREE.CREAR','ACADEMICO.MATERIA_TREE.EDITAR','ACADEMICO.MATERIA_TREE.VER','ACADEMICO.PAQUETES.CREAR','ACADEMICO.PAQUETES.EDITAR','ACADEMICO.PAQUETES.GESTIONAR','ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.CREAR','ACADEMICO.PRODUCTO.EDITAR','ACADEMICO.PRODUCTO.GESTIONAR','ACADEMICO.PRODUCTO.VER','ACADEMICO.PRODUCTO_EDUCATIVO.CREAR','ACADEMICO.PRODUCTO_EDUCATIVO.EDITAR','ACADEMICO.PRODUCTO_EDUCATIVO.VER','INFRA.ESPACIO.VER','INFRA.SUCURSAL.VER','PERSONA.ESTUDIANTES.CREAR','PERSONA.ESTUDIANTES.EDITAR','PERSONA.ESTUDIANTES.VER','PERSONA.TUTORES.VER','PERSONA.UNIDAD_EDUCATIVA.VER'])
WHERE r.codigo = 'COORDINADOR_ACADEMICO'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.REGISTRAR','ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.VER','ACADEMICO.CLASE_POR_HORA.CERRAR','ACADEMICO.CLASE_POR_HORA.VER','ACADEMICO.HORARIOS.VER','ACADEMICO.MATERIA_TREE.VER','PERSONA.ESTUDIANTES.VER'])
WHERE r.codigo = 'TUTOR_DOCENTE'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['CAJA.PAGO.REGISTRAR','CAJA.PAGO.VER','CONTAB.CUENTA.VER','INFRA.TIENDA.CREAR','INFRA.TIENDA.DESACTIVAR','INFRA.TIENDA.EDITAR','INFRA.TIENDA.VER','INV.BIEN.CREAR','INV.BIEN.DESACTIVAR','INV.BIEN.EDITAR','INV.BIEN.EXPORTAR','INV.BIEN.GESTIONAR','INV.BIEN.VER','INV.BIEN_INSTANCIA.CREAR','INV.BIEN_INSTANCIA.DESACTIVAR','INV.BIEN_INSTANCIA.EDITAR','INV.BIEN_INSTANCIA.VER','INV.BIEN_LOTE.CREAR','INV.BIEN_LOTE.DESACTIVAR','INV.BIEN_LOTE.EDITAR','INV.BIEN_LOTE.VER','INV.DEPRECIACION.EXPORTAR','INV.DEPRECIACION.VER','INV.KARDEX.EXPORTAR','INV.KARDEX.VER','INV.MOVIMIENTO.ANULAR','INV.MOVIMIENTO.EDITAR','INV.MOVIMIENTO.REGISTRAR','INV.MOVIMIENTO.VER','INV.MOVIMIENTO_DETALLE.ANULAR','INV.MOVIMIENTO_DETALLE.EDITAR','INV.MOVIMIENTO_DETALLE.REGISTRAR','INV.MOVIMIENTO_DETALLE.VER','INV.VALUACION.EJECUTAR','INV.VALUACION.EXPORTAR','INV.VALUACION.VER','PERSONA.PROVEEDORES.VER','REPORTES.COMERCIALES.EXPORTAR','REPORTES.COMERCIALES.VER'])
WHERE r.codigo = 'ENCARGADO_TIENDA'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['CONTAB.CUENTA.VER','INV.BIEN.CREAR','INV.BIEN.DESACTIVAR','INV.BIEN.EDITAR','INV.BIEN.EXPORTAR','INV.BIEN.GESTIONAR','INV.BIEN.VER','INV.BIEN_INSTANCIA.CREAR','INV.BIEN_INSTANCIA.DESACTIVAR','INV.BIEN_INSTANCIA.EDITAR','INV.BIEN_INSTANCIA.VER','INV.BIEN_LOTE.CREAR','INV.BIEN_LOTE.DESACTIVAR','INV.BIEN_LOTE.EDITAR','INV.BIEN_LOTE.VER','INV.DEPRECIACION.EXPORTAR','INV.DEPRECIACION.VER','INV.KARDEX.EXPORTAR','INV.KARDEX.VER','INV.MOVIMIENTO.ANULAR','INV.MOVIMIENTO.EDITAR','INV.MOVIMIENTO.REGISTRAR','INV.MOVIMIENTO.VER','INV.MOVIMIENTO_DETALLE.ANULAR','INV.MOVIMIENTO_DETALLE.EDITAR','INV.MOVIMIENTO_DETALLE.REGISTRAR','INV.MOVIMIENTO_DETALLE.VER','INV.VALUACION.EXPORTAR','INV.VALUACION.VER','PERSONA.PROVEEDORES.VER','REPORTES.INVENTARIO.EXPORTAR','REPORTES.INVENTARIO.VER'])
WHERE r.codigo = 'ALMACEN_INVENTARIO'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ADMIN.DEPARTAMENTO.CREAR','ADMIN.DEPARTAMENTO.DESACTIVAR','ADMIN.DEPARTAMENTO.EDITAR','ADMIN.DEPARTAMENTO.GESTIONAR','ADMIN.DEPARTAMENTO.VER','ADMIN.EMPLEADO.CREAR','ADMIN.EMPLEADO.DESACTIVAR','ADMIN.EMPLEADO.EDITAR','ADMIN.EMPLEADO.EXPORTAR','ADMIN.EMPLEADO.GESTIONAR','ADMIN.EMPLEADO.VER','ADMIN.EMPLEADO_POSICION_PAGO.CREAR','ADMIN.EMPLEADO_POSICION_PAGO.DESACTIVAR','ADMIN.EMPLEADO_POSICION_PAGO.EDITAR','ADMIN.EMPLEADO_POSICION_PAGO.VER','ADMIN.EMPLEADO_REGISTRO_PAGO.ANULAR','ADMIN.EMPLEADO_REGISTRO_PAGO.CREAR','ADMIN.EMPLEADO_REGISTRO_PAGO.EDITAR','ADMIN.EMPLEADO_REGISTRO_PAGO.EXPORTAR','ADMIN.EMPLEADO_REGISTRO_PAGO.VER','ADMIN.POSICION.CREAR','ADMIN.POSICION.DESACTIVAR','ADMIN.POSICION.EDITAR','ADMIN.POSICION.GESTIONAR','ADMIN.POSICION.VER','PERSONA.PERSONAS.CREAR','PERSONA.PERSONAS.EDITAR','PERSONA.PERSONAS.VER','REPORTES.RRHH.EXPORTAR','REPORTES.RRHH.VER'])
WHERE r.codigo = 'RRHH_ADMIN'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['AUDITORIA.TRAZABILIDAD.VER','SISTEMA.LOGS.VER','SISTEMA.PERMISOS.VER','SISTEMA.ROLES.VER','SISTEMA.SESIONES.CERRAR','SISTEMA.SESIONES.VER','SISTEMA.USUARIOS.DESACTIVAR','SISTEMA.USUARIOS.EDITAR','SISTEMA.USUARIOS.RESET_PASSWORD','SISTEMA.USUARIOS.VER'])
WHERE r.codigo = 'SOPORTE_TI'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['PERSONA.PERSONAS.CREAR','PERSONA.PERSONAS.EDITAR','PERSONA.PERSONAS.VER','REPORTES.EJECUTIVO.VER','SOC.CLASE_TITULO.CREAR','SOC.CLASE_TITULO.DESACTIVAR','SOC.CLASE_TITULO.EDITAR','SOC.CLASE_TITULO.VER','SOC.DIVIDENDO.ANULAR','SOC.DIVIDENDO.APROBAR','SOC.DIVIDENDO.CREAR','SOC.DIVIDENDO.VER','SOC.DIVIDENDO_PAGO.ANULAR','SOC.DIVIDENDO_PAGO.REGISTRAR','SOC.DIVIDENDO_PAGO.VER','SOC.EMISION_TITULO.ANULAR','SOC.EMISION_TITULO.CREAR','SOC.EMISION_TITULO.EDITAR','SOC.EMISION_TITULO.VER','SOC.TENENCIA.AJUSTAR','SOC.TENENCIA.CREAR','SOC.TENENCIA.EDITAR','SOC.TENENCIA.VER','SOC.TITULAR.CREAR','SOC.TITULAR.DESACTIVAR','SOC.TITULAR.EDITAR','SOC.TITULAR.VER','SOC.TITULOS.GESTIONAR','SOC.TITULOS.VER','SOC.TRANSFERENCIA_TITULO.ANULAR','SOC.TRANSFERENCIA_TITULO.CREAR','SOC.TRANSFERENCIA_TITULO.VER'])
WHERE r.codigo = 'LEGAL_SOCIETARIO'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.EXPORTAR','ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.EXPORTAR','ACADEMICO.CLASES.VER','ACADEMICO.CLASE_CURSO.VER','ACADEMICO.CLASE_POR_HORA.VER','ACADEMICO.CURSOS.VER','ACADEMICO.CURSO_VERSION.VER','ACADEMICO.HORARIOS.VER','ACADEMICO.MATERIA_TREE.VER','ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.VER','ACADEMICO.PRODUCTO_EDUCATIVO.VER','ADMIN.DEPARTAMENTO.VER','ADMIN.EMPLEADO.EXPORTAR','ADMIN.EMPLEADO.VER','ADMIN.EMPLEADO_POSICION_PAGO.VER','ADMIN.EMPLEADO_REGISTRO_PAGO.EXPORTAR','ADMIN.EMPLEADO_REGISTRO_PAGO.VER','ADMIN.KPI.VER','ADMIN.NOMINA.EXPORTAR','ADMIN.NOMINA.VER','ADMIN.OBJETIVO_KPI.VER','ADMIN.POSICION.VER','AUDITORIA.CAMBIOS_CRITICOS.EXPORTAR','AUDITORIA.CAMBIOS_CRITICOS.VER','AUDITORIA.PERMISOS_EFECTIVOS.EXPORTAR','AUDITORIA.PERMISOS_EFECTIVOS.VER','AUDITORIA.TRAZABILIDAD.EXPORTAR','AUDITORIA.TRAZABILIDAD.VER','CAJA.COBRANZA.EXPORTAR','CAJA.COBRANZA.VER','CAJA.DEUDA.EXPORTAR','CAJA.DEUDA.VER','CAJA.PAGO.EXPORTAR','CAJA.PAGO.VER','CAJA.RECIBOS.EXPORTAR','CAJA.RECIBOS.VER','CONFIG.CATALOGOS.VER','CONFIG.MAPEOS_CONTABLES.VER','CONFIG.PARAMETROS_NEGOCIO.VER','CONTAB.ARCHIVOS_TRANSACCION.VER','CONTAB.CENTRO_COSTO.VER','CONTAB.CENTRO_COSTO_MAPA.VER','CONTAB.CIERRE_PERIODO.VER','CONTAB.CONCEPTO_COSTO.VER','CONTAB.CONCILIACION.VER','CONTAB.CUENTA.EXPORTAR','CONTAB.CUENTA.VER','CONTAB.CUENTAS.VER','CONTAB.CUENTA_ASIGNACION.VER','CONTAB.EEFF.EXPORTAR','CONTAB.EEFF.GENERAR','CONTAB.EEFF.VER','CONTAB.GRUPO_CUENTA.VER','CONTAB.LIBRO_DIARIO.EXPORTAR','CONTAB.LIBRO_DIARIO.VER','CONTAB.LIBRO_MAYOR.EXPORTAR','CONTAB.LIBRO_MAYOR.VER','CONTAB.MOVIMIENTO_CUENTA.VER','CONTAB.PAGO_TUTOR.VER','CONTAB.TRANSACCION.EXPORTAR','CONTAB.TRANSACCION.VER','INFRA.EDIFICIO.VER','INFRA.ENCARGADO.VER','INFRA.ESPACIO.VER','INFRA.SUCURSAL.VER','INFRA.TIENDA.VER','INV.BIEN.EXPORTAR','INV.BIEN.VER','INV.BIEN_INSTANCIA.VER','INV.BIEN_LOTE.VER','INV.DEPRECIACION.EXPORTAR','INV.DEPRECIACION.VER','INV.KARDEX.EXPORTAR','INV.KARDEX.VER','INV.MOVIMIENTO.VER','INV.MOVIMIENTO_DETALLE.VER','INV.VALUACION.EXPORTAR','INV.VALUACION.VER','PERSONA.ESTUDIANTES.EXPORTAR','PERSONA.ESTUDIANTES.VER','PERSONA.ESTUDIANTE_PADRE.VER','PERSONA.PADRES.EXPORTAR','PERSONA.PADRES.VER','PERSONA.PERSONAS.EXPORTAR','PERSONA.PERSONAS.VER','PERSONA.PROVEEDORES.EXPORTAR','PERSONA.PROVEEDORES.VER','PERSONA.TUTORES.EXPORTAR','PERSONA.TUTORES.VER','PERSONA.UNIDAD_EDUCATIVA.EXPORTAR','PERSONA.UNIDAD_EDUCATIVA.VER','PERSONA.USUARIOS.VER','REPORTES.ACADEMICOS.EXPORTAR','REPORTES.ACADEMICOS.GENERAR','REPORTES.ACADEMICOS.VER','REPORTES.COMERCIALES.EXPORTAR','REPORTES.COMERCIALES.GENERAR','REPORTES.COMERCIALES.VER','REPORTES.EJECUTIVO.EXPORTAR','REPORTES.EJECUTIVO.GENERAR','REPORTES.EJECUTIVO.VER','REPORTES.FINANCIEROS.EXPORTAR','REPORTES.FINANCIEROS.GENERAR','REPORTES.FINANCIEROS.VER','REPORTES.INVENTARIO.EXPORTAR','REPORTES.INVENTARIO.GENERAR','REPORTES.INVENTARIO.VER','REPORTES.RRHH.EXPORTAR','REPORTES.RRHH.GENERAR','REPORTES.RRHH.VER','SISTEMA.LOGS.EXPORTAR','SISTEMA.LOGS.VER','SISTEMA.PERMISOS.VER','SISTEMA.ROLES.VER','SISTEMA.SESIONES.VER','SISTEMA.TOKEN_ACCION.VER','SISTEMA.USUARIOS.EXPORTAR','SISTEMA.USUARIOS.VER','SOC.CLASE_TITULO.VER','SOC.DIVIDENDO.VER','SOC.DIVIDENDO_PAGO.VER','SOC.EMISION_TITULO.VER','SOC.TENENCIA.VER','SOC.TITULAR.VER','SOC.TITULOS.VER','SOC.TRANSFERENCIA_TITULO.VER'])
WHERE r.codigo = 'AUDITOR_LECTURA'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.VER','ACADEMICO.HORARIOS.VER','ACADEMICO.PAQUETES.VER','ACADEMICO.PRODUCTO.VER','CAJA.DEUDA.VER','CAJA.PAGO.VER'])
WHERE r.codigo = 'ESTUDIANTE_PORTAL'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ACADEMICO.ASISTENCIA.VER','ACADEMICO.CLASES.VER','ACADEMICO.HORARIOS.VER','CAJA.DEUDA.VER','CAJA.PAGO.VER','PERSONA.ESTUDIANTE_PADRE.VER'])
WHERE r.codigo = 'PADRE_PORTAL'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['ADMINISTRACION.DEPARTAMENTO.CREATE','ADMINISTRACION.DEPARTAMENTO.READ','ADMINISTRACION.DEPARTAMENTO.UPDATE','ADMINISTRACION.EMPLEADO.CREATE','ADMINISTRACION.EMPLEADO.READ','ADMINISTRACION.EMPLEADO.UPDATE','ADMINISTRACION.EMPLEADO_POSICION_PAGO.CREATE','ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ','ADMINISTRACION.EMPLEADO_POSICION_PAGO.UPDATE','ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.CREATE','ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ','ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.UPDATE','ADMINISTRACION.KPI.CREATE','ADMINISTRACION.KPI.READ','ADMINISTRACION.KPI.UPDATE','ADMINISTRACION.OBJETIVO_KPI.CREATE','ADMINISTRACION.OBJETIVO_KPI.READ','ADMINISTRACION.OBJETIVO_KPI.UPDATE','ADMINISTRACION.POSICION.CREATE','ADMINISTRACION.POSICION.READ','ADMINISTRACION.POSICION.UPDATE','CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE','CONTABILIDAD.ARCHIVOS_TRANSACCION.READ','CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE','CONTABILIDAD.CENTRO_COSTO.CREATE','CONTABILIDAD.CENTRO_COSTO.READ','CONTABILIDAD.CENTRO_COSTO.UPDATE','CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE','CONTABILIDAD.CENTRO_COSTO_MAPA.READ','CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE','CONTABILIDAD.CONCEPTO_COSTO.CREATE','CONTABILIDAD.CONCEPTO_COSTO.READ','CONTABILIDAD.CONCEPTO_COSTO.UPDATE','CONTABILIDAD.CUENTA.CREATE','CONTABILIDAD.CUENTA.READ','CONTABILIDAD.CUENTA.UPDATE','CONTABILIDAD.CUENTA_ASIGNACION.CREATE','CONTABILIDAD.CUENTA_ASIGNACION.READ','CONTABILIDAD.CUENTA_ASIGNACION.UPDATE','CONTABILIDAD.GRUPO_CUENTA.CREATE','CONTABILIDAD.GRUPO_CUENTA.READ','CONTABILIDAD.GRUPO_CUENTA.UPDATE','CONTABILIDAD.PAGO_TUTOR.CREATE','CONTABILIDAD.PAGO_TUTOR.READ','CONTABILIDAD.PAGO_TUTOR.UPDATE','CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE','CONTABILIDAD.PAGO_TUTOR_DETALLE.READ','CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE','CONTABILIDAD.TRANSACCION.CREATE','CONTABILIDAD.TRANSACCION.READ','CONTABILIDAD.TRANSACCION.UPDATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE','DEUDA.DEUDA.CREATE','DEUDA.DEUDA.READ','DEUDA.DEUDA.UPDATE','DEUDA.PAGO.CREATE','DEUDA.PAGO.READ','DEUDA.PAGO.UPDATE','INFRAESTRUCTURA.EDIFICIO.CREATE','INFRAESTRUCTURA.EDIFICIO.READ','INFRAESTRUCTURA.EDIFICIO.UPDATE','INFRAESTRUCTURA.ENCARGADO.CREATE','INFRAESTRUCTURA.ENCARGADO.READ','INFRAESTRUCTURA.ENCARGADO.UPDATE','INFRAESTRUCTURA.ESPACIO.CREATE','INFRAESTRUCTURA.ESPACIO.READ','INFRAESTRUCTURA.ESPACIO.UPDATE','INFRAESTRUCTURA.SUCURSAL.CREATE','INFRAESTRUCTURA.SUCURSAL.READ','INFRAESTRUCTURA.SUCURSAL.UPDATE','INFRAESTRUCTURA.TIENDA.CREATE','INFRAESTRUCTURA.TIENDA.READ','INFRAESTRUCTURA.TIENDA.UPDATE','INVENTARIO.BIEN.CREATE','INVENTARIO.BIEN.READ','INVENTARIO.BIEN.UPDATE','INVENTARIO.BIEN_INSTANCIA.CREATE','INVENTARIO.BIEN_INSTANCIA.READ','INVENTARIO.BIEN_INSTANCIA.UPDATE','INVENTARIO.BIEN_LOTE.CREATE','INVENTARIO.BIEN_LOTE.READ','INVENTARIO.BIEN_LOTE.UPDATE','INVENTARIO.MOVIMIENTO_DETALLE.CREATE','INVENTARIO.MOVIMIENTO_DETALLE.READ','INVENTARIO.MOVIMIENTO_DETALLE.UPDATE','PERSONAS.PERSONA_ESTUDIANTE.CREATE','PERSONAS.PERSONA_ESTUDIANTE.READ','PERSONAS.PERSONA_ESTUDIANTE.UPDATE','PERSONAS.ESTUDIANTE_PADRE.CREATE','PERSONAS.ESTUDIANTE_PADRE.READ','PERSONAS.ESTUDIANTE_PADRE.UPDATE','PERSONAS.PERSONA_PADRE.CREATE','PERSONAS.PERSONA_PADRE.READ','PERSONAS.PERSONA_PADRE.UPDATE','PERSONAS.PROVEEDOR.CREATE','PERSONAS.PROVEEDOR.READ','PERSONAS.PROVEEDOR.UPDATE','PERSONAS.PERSONA_TUTOR.CREATE','PERSONAS.PERSONA_TUTOR.READ','PERSONAS.PERSONA_TUTOR.UPDATE','PERSONAS.UNIDAD_EDUCATIVA.CREATE','PERSONAS.UNIDAD_EDUCATIVA.READ','PERSONAS.UNIDAD_EDUCATIVA.UPDATE','PERSONAS.PERSONA_USUARIO.CREATE','PERSONAS.PERSONA_USUARIO.READ','PERSONAS.PERSONA_USUARIO.UPDATE','SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.CREATE','SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ','SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.UPDATE','SERVICIOS_EDUCATIVOS.CLASE_CURSO.CREATE','SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ','SERVICIOS_EDUCATIVOS.CLASE_CURSO.UPDATE','SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.CREATE','SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ','SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.UPDATE','SERVICIOS_EDUCATIVOS.CURSO_VERSION.CREATE','SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ','SERVICIOS_EDUCATIVOS.CURSO_VERSION.UPDATE','SERVICIOS_EDUCATIVOS.HORARIOS.CREATE','SERVICIOS_EDUCATIVOS.HORARIOS.READ','SERVICIOS_EDUCATIVOS.HORARIOS.UPDATE','SERVICIOS_EDUCATIVOS.MATERIA_TREE.CREATE','SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ','SERVICIOS_EDUCATIVOS.MATERIA_TREE.UPDATE','SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.CREATE','SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ','SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.UPDATE','SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.CREATE','SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ','SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.UPDATE','SOCIETARIO.CLASE_TITULO.CREATE','SOCIETARIO.CLASE_TITULO.READ','SOCIETARIO.CLASE_TITULO.UPDATE','SOCIETARIO.DIVIDENDO.CREATE','SOCIETARIO.DIVIDENDO.READ','SOCIETARIO.DIVIDENDO.UPDATE','SOCIETARIO.DIVIDENDO_PAGO.CREATE','SOCIETARIO.DIVIDENDO_PAGO.READ','SOCIETARIO.DIVIDENDO_PAGO.UPDATE','SOCIETARIO.EMISION_TITULO.CREATE','SOCIETARIO.EMISION_TITULO.READ','SOCIETARIO.EMISION_TITULO.UPDATE','SOCIETARIO.TENENCIA.CREATE','SOCIETARIO.TENENCIA.READ','SOCIETARIO.TENENCIA.UPDATE','SOCIETARIO.TITULAR.CREATE','SOCIETARIO.TITULAR.READ','SOCIETARIO.TITULAR.UPDATE','SOCIETARIO.TRANSFERENCIA_TITULO.CREATE','SOCIETARIO.TRANSFERENCIA_TITULO.READ','SOCIETARIO.TRANSFERENCIA_TITULO.UPDATE','CONTABILIDAD.TRANSACCION.REVERT','CONTABILIDAD.TRANSACCION.CON_MOVIMIENTOS','CONTABILIDAD.TRANSACCION.BATCH_CREATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.BATCH_CREATE','CONTABILIDAD.LIBRO_DIARIO.READ','CONTABILIDAD.LIBRO_MAYOR.READ','CONTABILIDAD.EEFF.READ'])
WHERE r.codigo IN ('SUPER_ADMIN', 'ADMIN_GENERAL')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
JOIN seguridad.permiso p ON p.codigo = ANY(ARRAY['CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE','CONTABILIDAD.ARCHIVOS_TRANSACCION.READ','CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE','CONTABILIDAD.CENTRO_COSTO.CREATE','CONTABILIDAD.CENTRO_COSTO.READ','CONTABILIDAD.CENTRO_COSTO.UPDATE','CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE','CONTABILIDAD.CENTRO_COSTO_MAPA.READ','CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE','CONTABILIDAD.CONCEPTO_COSTO.CREATE','CONTABILIDAD.CONCEPTO_COSTO.READ','CONTABILIDAD.CONCEPTO_COSTO.UPDATE','CONTABILIDAD.CUENTA.CREATE','CONTABILIDAD.CUENTA.READ','CONTABILIDAD.CUENTA.UPDATE','CONTABILIDAD.CUENTA_ASIGNACION.CREATE','CONTABILIDAD.CUENTA_ASIGNACION.READ','CONTABILIDAD.CUENTA_ASIGNACION.UPDATE','CONTABILIDAD.GRUPO_CUENTA.CREATE','CONTABILIDAD.GRUPO_CUENTA.READ','CONTABILIDAD.GRUPO_CUENTA.UPDATE','CONTABILIDAD.PAGO_TUTOR.CREATE','CONTABILIDAD.PAGO_TUTOR.READ','CONTABILIDAD.PAGO_TUTOR.UPDATE','CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE','CONTABILIDAD.PAGO_TUTOR_DETALLE.READ','CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE','CONTABILIDAD.TRANSACCION.CREATE','CONTABILIDAD.TRANSACCION.READ','CONTABILIDAD.TRANSACCION.UPDATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE','DEUDA.DEUDA.CREATE','DEUDA.DEUDA.READ','DEUDA.DEUDA.UPDATE','DEUDA.PAGO.CREATE','DEUDA.PAGO.READ','DEUDA.PAGO.UPDATE','CONTABILIDAD.TRANSACCION.REVERT','CONTABILIDAD.TRANSACCION.CON_MOVIMIENTOS','CONTABILIDAD.TRANSACCION.BATCH_CREATE','CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.BATCH_CREATE','CONTABILIDAD.LIBRO_DIARIO.READ','CONTABILIDAD.LIBRO_MAYOR.READ','CONTABILIDAD.EEFF.READ'])
WHERE r.codigo IN ('CONTADOR_GENERAL', 'CONTADOR')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r_contador.id_rol, rp.id_permiso
FROM seguridad.rol r_contador
JOIN seguridad.rol r_general ON r_general.codigo = 'CONTADOR_GENERAL'
JOIN seguridad.rol_permiso rp ON rp.id_rol = r_general.id_rol
WHERE r_contador.codigo = 'CONTADOR'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT pu.id_persona, r.id_rol, 'Activo'
FROM persona.persona_usuario pu
JOIN seguridad.rol r ON r.codigo = ANY(ARRAY['SUPER_ADMIN','ADMIN_GENERAL'])
WHERE pu.nombre_usuario IN ('pablo.admin', 'katia.admin')
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(seguridad.usuario_rol.version_registro,1)+1;
INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro)
SELECT pu.id_persona, r.id_rol, 'Activo'
FROM persona.persona_usuario pu
JOIN seguridad.rol r ON r.codigo = ANY(ARRAY['CONTADOR_GENERAL','CONTADOR'])
WHERE pu.nombre_usuario = 'maria.contador'
ON CONFLICT (id_persona, id_rol) DO UPDATE SET estado_registro='Activo', fecha_modificacion=NOW(), version_registro=COALESCE(seguridad.usuario_rol.version_registro,1)+1;

SELECT setval(pg_get_serial_sequence('seguridad.permiso', 'id_permiso'), COALESCE((SELECT MAX(id_permiso) FROM seguridad.permiso), 1), true);
SELECT setval(pg_get_serial_sequence('seguridad.rol', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM seguridad.rol), 1), true);
SELECT setval(pg_get_serial_sequence('persona.persona', 'id_persona'), COALESCE((SELECT MAX(id_persona) FROM persona.persona), 1), true);
SELECT setval(pg_get_serial_sequence('administracion.empleado', 'id_empleado'), COALESCE((SELECT MAX(id_empleado) FROM administracion.empleado), 1), true);
SELECT setval(pg_get_serial_sequence('infraestructura.sucursal', 'id_sucursal'), COALESCE((SELECT MAX(id_sucursal) FROM infraestructura.sucursal), 1), true);
SELECT setval(pg_get_serial_sequence('infraestructura.edificio', 'id_edificio'), COALESCE((SELECT MAX(id_edificio) FROM infraestructura.edificio), 1), true);
SELECT setval(pg_get_serial_sequence('infraestructura.espacio', 'id_espacio'), COALESCE((SELECT MAX(id_espacio) FROM infraestructura.espacio), 1), true);
SELECT setval(pg_get_serial_sequence('infraestructura.tienda', 'id_tienda'), COALESCE((SELECT MAX(id_tienda) FROM infraestructura.tienda), 1), true);
SELECT setval(pg_get_serial_sequence('administracion.departamento', 'id_departamento'), COALESCE((SELECT MAX(id_departamento) FROM administracion.departamento), 1), true);
SELECT setval(pg_get_serial_sequence('administracion.posicion', 'id_posicion'), COALESCE((SELECT MAX(id_posicion) FROM administracion.posicion), 1), true);
SELECT setval(pg_get_serial_sequence('administracion.kpi', 'id_kpi'), COALESCE((SELECT MAX(id_kpi) FROM administracion.kpi), 1), true);
SELECT setval(pg_get_serial_sequence('persona.unidad_educativa', 'id_unidad_educativa'), COALESCE((SELECT MAX(id_unidad_educativa) FROM persona.unidad_educativa), 1), true);
SELECT setval(pg_get_serial_sequence('persona.proveedor', 'id_proveedor'), COALESCE((SELECT MAX(id_proveedor) FROM persona.proveedor), 1), true);
SELECT setval(pg_get_serial_sequence('societario.clase_titulo', 'id_clase_titulo'), COALESCE((SELECT MAX(id_clase_titulo) FROM societario.clase_titulo), 1), true);

COMMIT;