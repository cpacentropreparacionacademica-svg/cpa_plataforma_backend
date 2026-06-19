export interface ResourceConfig {
  key: string;
  entity: string;
  /** Carpeta/dominio lógico usado para organizar la documentación y trazabilidad. */
  domainFolder?: string;
  routeModule: string;
  routePath: string;
  schema: string;
  tableName: string;
  primaryKeys: string[];
  permissions?: Partial<Record<'create' | 'read' | 'update', string>>;
}

export const RESOURCES: ResourceConfig[] = [
  {
    "key": "departamento",
    "entity": "departamento",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "departamento",
    "schema": "administracion",
    "tableName": "departamento",
    "primaryKeys": [
      "id_departamento"
    ],
    "permissions": {
      "create": "ADMINISTRACION.DEPARTAMENTO.CREATE",
      "read": "ADMINISTRACION.DEPARTAMENTO.READ",
      "update": "ADMINISTRACION.DEPARTAMENTO.UPDATE"
    }
  },
  {
    "key": "empleado",
    "entity": "empleado",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "empleado",
    "schema": "administracion",
    "tableName": "empleado",
    "primaryKeys": [
      "id_empleado"
    ],
    "permissions": {
      "create": "ADMINISTRACION.EMPLEADO.CREATE",
      "read": "ADMINISTRACION.EMPLEADO.READ",
      "update": "ADMINISTRACION.EMPLEADO.UPDATE"
    }
  },
  {
    "key": "empleado_posicion_pago",
    "entity": "empleado_posicion_pago",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "empleado-posicion-pago",
    "schema": "administracion",
    "tableName": "empleado_posicion_pago",
    "primaryKeys": [
      "id_empleado_posicion"
    ],
    "permissions": {
      "create": "ADMINISTRACION.EMPLEADO_POSICION_PAGO.CREATE",
      "read": "ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ",
      "update": "ADMINISTRACION.EMPLEADO_POSICION_PAGO.UPDATE"
    }
  },
  {
    "key": "empleado_registro_pago",
    "entity": "empleado_registro_pago",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "empleado-registro-pago",
    "schema": "administracion",
    "tableName": "empleado_registro_pago",
    "primaryKeys": [
      "id_pago"
    ],
    "permissions": {
      "create": "ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.CREATE",
      "read": "ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ",
      "update": "ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.UPDATE"
    }
  },
  {
    "key": "kpi",
    "entity": "kpi",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "kpi",
    "schema": "administracion",
    "tableName": "kpi",
    "primaryKeys": [
      "id_kpi"
    ],
    "permissions": {
      "create": "ADMINISTRACION.KPI.CREATE",
      "read": "ADMINISTRACION.KPI.READ",
      "update": "ADMINISTRACION.KPI.UPDATE"
    }
  },
  {
    "key": "objetivo_kpi",
    "entity": "objetivo_kpi",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "objetivo-kpi",
    "schema": "administracion",
    "tableName": "objetivo_kpi",
    "primaryKeys": [
      "id_objetivo_kpi"
    ],
    "permissions": {
      "create": "ADMINISTRACION.OBJETIVO_KPI.CREATE",
      "read": "ADMINISTRACION.OBJETIVO_KPI.READ",
      "update": "ADMINISTRACION.OBJETIVO_KPI.UPDATE"
    }
  },
  {
    "key": "posicion",
    "entity": "posicion",
    "domainFolder": "administracion",
    "routeModule": "administracion",
    "routePath": "posicion",
    "schema": "administracion",
    "tableName": "posicion",
    "primaryKeys": [
      "id_posicion"
    ],
    "permissions": {
      "create": "ADMINISTRACION.POSICION.CREATE",
      "read": "ADMINISTRACION.POSICION.READ",
      "update": "ADMINISTRACION.POSICION.UPDATE"
    }
  },
  {
    "key": "archivos_transaccion",
    "entity": "archivos_transaccion",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "archivos-transaccion",
    "schema": "contabilidad",
    "tableName": "archivos_transaccion",
    "primaryKeys": [
      "id_archivo"
    ],
    "permissions": {
      "create": "CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE",
      "read": "CONTABILIDAD.ARCHIVOS_TRANSACCION.READ",
      "update": "CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE"
    }
  },
  {
    "key": "centro_costo",
    "entity": "centro_costo",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "centro-costo",
    "schema": "contabilidad",
    "tableName": "centro_costo",
    "primaryKeys": [
      "id_centro_costo"
    ],
    "permissions": {
      "create": "CONTABILIDAD.CENTRO_COSTO.CREATE",
      "read": "CONTABILIDAD.CENTRO_COSTO.READ",
      "update": "CONTABILIDAD.CENTRO_COSTO.UPDATE"
    }
  },
  {
    "key": "centro_costo_mapa",
    "entity": "centro_costo_mapa",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "centro-costo-mapa",
    "schema": "contabilidad",
    "tableName": "centro_costo_mapa",
    "primaryKeys": [
      "id_cc_mapa"
    ],
    "permissions": {
      "create": "CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE",
      "read": "CONTABILIDAD.CENTRO_COSTO_MAPA.READ",
      "update": "CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE"
    }
  },
  {
    "key": "concepto_costo",
    "entity": "concepto_costo",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "concepto-costo",
    "schema": "contabilidad",
    "tableName": "concepto_costo",
    "primaryKeys": [
      "id_concepto"
    ],
    "permissions": {
      "create": "CONTABILIDAD.CONCEPTO_COSTO.CREATE",
      "read": "CONTABILIDAD.CONCEPTO_COSTO.READ",
      "update": "CONTABILIDAD.CONCEPTO_COSTO.UPDATE"
    }
  },
  {
    "key": "cuenta",
    "entity": "cuenta",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "cuenta",
    "schema": "contabilidad",
    "tableName": "cuenta",
    "primaryKeys": [
      "id_cuenta"
    ],
    "permissions": {
      "create": "CONTABILIDAD.CUENTA.CREATE",
      "read": "CONTABILIDAD.CUENTA.READ",
      "update": "CONTABILIDAD.CUENTA.UPDATE"
    }
  },
  {
    "key": "cuenta_asignacion",
    "entity": "cuenta_asignacion",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "cuenta-asignacion",
    "schema": "contabilidad",
    "tableName": "cuenta_asignacion",
    "primaryKeys": [
      "id_cuenta_asignacion"
    ],
    "permissions": {
      "create": "CONTABILIDAD.CUENTA_ASIGNACION.CREATE",
      "read": "CONTABILIDAD.CUENTA_ASIGNACION.READ",
      "update": "CONTABILIDAD.CUENTA_ASIGNACION.UPDATE"
    }
  },
  {
    "key": "grupo_cuenta",
    "entity": "grupo_cuenta",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "grupo-cuenta",
    "schema": "contabilidad",
    "tableName": "grupo_cuenta",
    "primaryKeys": [
      "id_grupo_cuenta"
    ],
    "permissions": {
      "create": "CONTABILIDAD.GRUPO_CUENTA.CREATE",
      "read": "CONTABILIDAD.GRUPO_CUENTA.READ",
      "update": "CONTABILIDAD.GRUPO_CUENTA.UPDATE"
    }
  },
  {
    "key": "pago_tutor",
    "entity": "pago_tutor",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "pago-tutor",
    "schema": "contabilidad",
    "tableName": "pago_tutor",
    "primaryKeys": [
      "id_pago_tutor"
    ],
    "permissions": {
      "create": "CONTABILIDAD.PAGO_TUTOR.CREATE",
      "read": "CONTABILIDAD.PAGO_TUTOR.READ",
      "update": "CONTABILIDAD.PAGO_TUTOR.UPDATE"
    }
  },
  {
    "key": "pago_tutor_detalle",
    "entity": "pago_tutor_detalle",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "pago-tutor-detalle",
    "schema": "contabilidad",
    "tableName": "pago_tutor_detalle",
    "primaryKeys": [
      "id_pago_tutor_detalle"
    ],
    "permissions": {
      "create": "CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE",
      "read": "CONTABILIDAD.PAGO_TUTOR_DETALLE.READ",
      "update": "CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE"
    }
  },
  {
    "key": "transaccion",
    "entity": "transaccion",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "transaccion",
    "schema": "contabilidad",
    "tableName": "transaccion",
    "primaryKeys": [
      "id_transaccion"
    ],
    "permissions": {
      "create": "CONTABILIDAD.TRANSACCION.CREATE",
      "read": "CONTABILIDAD.TRANSACCION.READ",
      "update": "CONTABILIDAD.TRANSACCION.UPDATE"
    }
  },
  {
    "key": "transaccion_movimiento_cuenta",
    "entity": "transaccion_movimiento_cuenta",
    "domainFolder": "contabilidad",
    "routeModule": "contabilidad",
    "routePath": "transaccion-movimiento-cuenta",
    "schema": "contabilidad",
    "tableName": "transaccion_movimiento_cuenta",
    "primaryKeys": [
      "id_movimiento"
    ],
    "permissions": {
      "create": "CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE",
      "read": "CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ",
      "update": "CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE"
    }
  },
  {
    "key": "deuda",
    "entity": "deuda",
    "domainFolder": "deuda",
    "routeModule": "deuda",
    "routePath": "deuda",
    "schema": "deuda",
    "tableName": "deuda",
    "primaryKeys": [
      "id_deuda"
    ],
    "permissions": {
      "create": "DEUDA.DEUDA.CREATE",
      "read": "DEUDA.DEUDA.READ",
      "update": "DEUDA.DEUDA.UPDATE"
    }
  },
  {
    "key": "pago",
    "entity": "pago",
    "domainFolder": "deuda",
    "routeModule": "deuda",
    "routePath": "pago",
    "schema": "deuda",
    "tableName": "pago",
    "primaryKeys": [
      "id_pago"
    ],
    "permissions": {
      "create": "DEUDA.PAGO.CREATE",
      "read": "DEUDA.PAGO.READ",
      "update": "DEUDA.PAGO.UPDATE"
    }
  },
  {
    "key": "edificio",
    "entity": "edificio",
    "domainFolder": "infraestructura",
    "routeModule": "infraestructura",
    "routePath": "edificio",
    "schema": "infraestructura",
    "tableName": "edificio",
    "primaryKeys": [
      "id_edificio"
    ],
    "permissions": {
      "create": "INFRAESTRUCTURA.EDIFICIO.CREATE",
      "read": "INFRAESTRUCTURA.EDIFICIO.READ",
      "update": "INFRAESTRUCTURA.EDIFICIO.UPDATE"
    }
  },
  {
    "key": "encargado",
    "entity": "encargado",
    "domainFolder": "infraestructura",
    "routeModule": "infraestructura",
    "routePath": "encargado",
    "schema": "infraestructura",
    "tableName": "encargado",
    "primaryKeys": [
      "id_asignacion"
    ],
    "permissions": {
      "create": "INFRAESTRUCTURA.ENCARGADO.CREATE",
      "read": "INFRAESTRUCTURA.ENCARGADO.READ",
      "update": "INFRAESTRUCTURA.ENCARGADO.UPDATE"
    }
  },
  {
    "key": "espacio",
    "entity": "espacio",
    "domainFolder": "infraestructura",
    "routeModule": "infraestructura",
    "routePath": "espacio",
    "schema": "infraestructura",
    "tableName": "espacio",
    "primaryKeys": [
      "id_espacio"
    ],
    "permissions": {
      "create": "INFRAESTRUCTURA.ESPACIO.CREATE",
      "read": "INFRAESTRUCTURA.ESPACIO.READ",
      "update": "INFRAESTRUCTURA.ESPACIO.UPDATE"
    }
  },
  {
    "key": "sucursal",
    "entity": "sucursal",
    "domainFolder": "infraestructura",
    "routeModule": "infraestructura",
    "routePath": "sucursal",
    "schema": "infraestructura",
    "tableName": "sucursal",
    "primaryKeys": [
      "id_sucursal"
    ],
    "permissions": {
      "create": "INFRAESTRUCTURA.SUCURSAL.CREATE",
      "read": "INFRAESTRUCTURA.SUCURSAL.READ",
      "update": "INFRAESTRUCTURA.SUCURSAL.UPDATE"
    }
  },
  {
    "key": "tienda",
    "entity": "tienda",
    "domainFolder": "infraestructura",
    "routeModule": "infraestructura",
    "routePath": "tienda",
    "schema": "infraestructura",
    "tableName": "tienda",
    "primaryKeys": [
      "id_tienda"
    ],
    "permissions": {
      "create": "INFRAESTRUCTURA.TIENDA.CREATE",
      "read": "INFRAESTRUCTURA.TIENDA.READ",
      "update": "INFRAESTRUCTURA.TIENDA.UPDATE"
    }
  },
  {
    "key": "bien",
    "entity": "bien",
    "domainFolder": "inventario",
    "routeModule": "inventario",
    "routePath": "bien",
    "schema": "inventario",
    "tableName": "bien",
    "primaryKeys": [
      "id_bien"
    ],
    "permissions": {
      "create": "INVENTARIO.BIEN.CREATE",
      "read": "INVENTARIO.BIEN.READ",
      "update": "INVENTARIO.BIEN.UPDATE"
    }
  },
  {
    "key": "bien_instancia",
    "entity": "bien_instancia",
    "domainFolder": "inventario",
    "routeModule": "inventario",
    "routePath": "bien-instancia",
    "schema": "inventario",
    "tableName": "bien_instancia",
    "primaryKeys": [
      "id_bien_instancia"
    ],
    "permissions": {
      "create": "INVENTARIO.BIEN_INSTANCIA.CREATE",
      "read": "INVENTARIO.BIEN_INSTANCIA.READ",
      "update": "INVENTARIO.BIEN_INSTANCIA.UPDATE"
    }
  },
  {
    "key": "bien_lote",
    "entity": "bien_lote",
    "domainFolder": "inventario",
    "routeModule": "inventario",
    "routePath": "bien-lote",
    "schema": "inventario",
    "tableName": "bien_lote",
    "primaryKeys": [
      "id_lote"
    ],
    "permissions": {
      "create": "INVENTARIO.BIEN_LOTE.CREATE",
      "read": "INVENTARIO.BIEN_LOTE.READ",
      "update": "INVENTARIO.BIEN_LOTE.UPDATE"
    }
  },
  {
    "key": "movimiento_detalle",
    "entity": "movimiento_detalle",
    "domainFolder": "inventario",
    "routeModule": "inventario",
    "routePath": "movimiento-detalle",
    "schema": "inventario",
    "tableName": "movimiento_detalle",
    "primaryKeys": [
      "id_movimiento"
    ],
    "permissions": {
      "create": "INVENTARIO.MOVIMIENTO_DETALLE.CREATE",
      "read": "INVENTARIO.MOVIMIENTO_DETALLE.READ",
      "update": "INVENTARIO.MOVIMIENTO_DETALLE.UPDATE"
    }
  },
  {
    "key": "persona_estudiante",
    "entity": "persona_estudiante",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "estudiante",
    "schema": "persona",
    "tableName": "persona_estudiante",
    "primaryKeys": [
      "id_persona"
    ],
    "permissions": {
      "create": "PERSONAS.PERSONA_ESTUDIANTE.CREATE",
      "read": "PERSONAS.PERSONA_ESTUDIANTE.READ",
      "update": "PERSONAS.PERSONA_ESTUDIANTE.UPDATE"
    }
  },
  {
    "key": "estudiante_padre",
    "entity": "estudiante_padre",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "estudiante-padre",
    "schema": "persona",
    "tableName": "estudiante_padre",
    "primaryKeys": [
      "id_asociacion"
    ],
    "permissions": {
      "create": "PERSONAS.ESTUDIANTE_PADRE.CREATE",
      "read": "PERSONAS.ESTUDIANTE_PADRE.READ",
      "update": "PERSONAS.ESTUDIANTE_PADRE.UPDATE"
    }
  },
  {
    "key": "persona_padre",
    "entity": "persona_padre",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "padre",
    "schema": "persona",
    "tableName": "persona_padre",
    "primaryKeys": [
      "id_padre"
    ],
    "permissions": {
      "create": "PERSONAS.PERSONA_PADRE.CREATE",
      "read": "PERSONAS.PERSONA_PADRE.READ",
      "update": "PERSONAS.PERSONA_PADRE.UPDATE"
    }
  },
  {
    "key": "proveedor",
    "entity": "proveedor",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "proveedor",
    "schema": "persona",
    "tableName": "proveedor",
    "primaryKeys": [
      "id_proveedor"
    ],
    "permissions": {
      "create": "PERSONAS.PROVEEDOR.CREATE",
      "read": "PERSONAS.PROVEEDOR.READ",
      "update": "PERSONAS.PROVEEDOR.UPDATE"
    }
  },
  {
    "key": "persona_tutor",
    "entity": "persona_tutor",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "tutor",
    "schema": "persona",
    "tableName": "persona_tutor",
    "primaryKeys": [
      "id_tutor"
    ],
    "permissions": {
      "create": "PERSONAS.PERSONA_TUTOR.CREATE",
      "read": "PERSONAS.PERSONA_TUTOR.READ",
      "update": "PERSONAS.PERSONA_TUTOR.UPDATE"
    }
  },
  {
    "key": "unidad_educativa",
    "entity": "unidad_educativa",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "unidad-educativa",
    "schema": "persona",
    "tableName": "unidad_educativa",
    "primaryKeys": [
      "id_unidad_educativa"
    ],
    "permissions": {
      "create": "PERSONAS.UNIDAD_EDUCATIVA.CREATE",
      "read": "PERSONAS.UNIDAD_EDUCATIVA.READ",
      "update": "PERSONAS.UNIDAD_EDUCATIVA.UPDATE"
    }
  },
  {
    "key": "persona_usuario",
    "entity": "persona_usuario",
    "domainFolder": "persona",
    "routeModule": "personas",
    "routePath": "usuario",
    "schema": "persona",
    "tableName": "persona_usuario",
    "primaryKeys": [
      "id_persona"
    ],
    "permissions": {
      "create": "PERSONAS.PERSONA_USUARIO.CREATE",
      "read": "PERSONAS.PERSONA_USUARIO.READ",
      "update": "PERSONAS.PERSONA_USUARIO.UPDATE"
    }
  },
  {
    "key": "permiso",
    "entity": "permiso",
    "domainFolder": "seguridad",
    "routeModule": "seguridad",
    "routePath": "permiso",
    "schema": "seguridad",
    "tableName": "permiso",
    "primaryKeys": [
      "id_permiso"
    ],
    "permissions": {}
  },
  {
    "key": "rol",
    "entity": "rol",
    "domainFolder": "seguridad",
    "routeModule": "seguridad",
    "routePath": "rol",
    "schema": "seguridad",
    "tableName": "rol",
    "primaryKeys": [
      "id_rol"
    ],
    "permissions": {}
  },
  {
    "key": "rol_permiso",
    "entity": "rol_permiso",
    "domainFolder": "seguridad",
    "routeModule": "seguridad",
    "routePath": "rol-permiso",
    "schema": "seguridad",
    "tableName": "rol_permiso",
    "primaryKeys": [
      "id_rol",
      "id_permiso"
    ],
    "permissions": {}
  },
  {
    "key": "usuario_permiso",
    "entity": "usuario_permiso",
    "domainFolder": "seguridad",
    "routeModule": "seguridad",
    "routePath": "usuario-permiso",
    "schema": "seguridad",
    "tableName": "usuario_permiso",
    "primaryKeys": [
      "id_persona",
      "id_permiso"
    ],
    "permissions": {}
  },
  {
    "key": "usuario_rol",
    "entity": "usuario_rol",
    "domainFolder": "seguridad",
    "routeModule": "seguridad",
    "routePath": "usuario-rol",
    "schema": "seguridad",
    "tableName": "usuario_rol",
    "primaryKeys": [
      "id_persona",
      "id_rol"
    ],
    "permissions": {}
  },
  {
    "key": "asistencia_clase_curso",
    "entity": "asistencia_clase_curso",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "asistencia-clase-curso",
    "schema": "servicios_educativos",
    "tableName": "asistencia_clase_curso",
    "primaryKeys": [
      "id_asistencia"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ",
      "update": "SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.UPDATE"
    }
  },
  {
    "key": "clase_curso",
    "entity": "clase_curso",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "clase-curso",
    "schema": "servicios_educativos",
    "tableName": "clase_curso",
    "primaryKeys": [
      "id_clase_curso"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.CLASE_CURSO.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ",
      "update": "SERVICIOS_EDUCATIVOS.CLASE_CURSO.UPDATE"
    }
  },
  {
    "key": "clase_por_hora",
    "entity": "clase_por_hora",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "clase-por-hora",
    "schema": "servicios_educativos",
    "tableName": "clase_por_hora",
    "primaryKeys": [
      "id_clase"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ",
      "update": "SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.UPDATE"
    }
  },
  {
    "key": "curso_version",
    "entity": "curso_version",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "curso-version",
    "schema": "servicios_educativos",
    "tableName": "curso_version",
    "primaryKeys": [
      "id_curso_version"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.CURSO_VERSION.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ",
      "update": "SERVICIOS_EDUCATIVOS.CURSO_VERSION.UPDATE"
    }
  },
  {
    "key": "horarios",
    "entity": "horarios",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "horarios",
    "schema": "servicios_educativos",
    "tableName": "horarios",
    "primaryKeys": [
      "id_horario"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.HORARIOS.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.HORARIOS.READ",
      "update": "SERVICIOS_EDUCATIVOS.HORARIOS.UPDATE"
    }
  },
  {
    "key": "materia_tree",
    "entity": "materia_tree",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "materia-tree",
    "schema": "servicios_educativos",
    "tableName": "materia_tree",
    "primaryKeys": [
      "id_tree"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.MATERIA_TREE.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ",
      "update": "SERVICIOS_EDUCATIVOS.MATERIA_TREE.UPDATE"
    }
  },
  {
    "key": "paquetes_producto_educativo",
    "entity": "paquetes_producto_educativo",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "paquetes-producto-educativo",
    "schema": "servicios_educativos",
    "tableName": "paquetes_producto_educativo",
    "primaryKeys": [
      "id_paquete"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ",
      "update": "SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.UPDATE"
    }
  },
  {
    "key": "producto_educativo",
    "entity": "producto_educativo",
    "domainFolder": "servicios_educativos",
    "routeModule": "servicios_educativos",
    "routePath": "producto-educativo",
    "schema": "servicios_educativos",
    "tableName": "producto_educativo",
    "primaryKeys": [
      "id_producto_educativo"
    ],
    "permissions": {
      "create": "SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.CREATE",
      "read": "SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ",
      "update": "SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.UPDATE"
    }
  },
  {
    "key": "clase_titulo",
    "entity": "clase_titulo",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "clase-titulo",
    "schema": "societario",
    "tableName": "clase_titulo",
    "primaryKeys": [
      "id_clase_titulo"
    ],
    "permissions": {
      "create": "SOCIETARIO.CLASE_TITULO.CREATE",
      "read": "SOCIETARIO.CLASE_TITULO.READ",
      "update": "SOCIETARIO.CLASE_TITULO.UPDATE"
    }
  },
  {
    "key": "dividendo",
    "entity": "dividendo",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "dividendo",
    "schema": "societario",
    "tableName": "dividendo",
    "primaryKeys": [
      "id_dividendo"
    ],
    "permissions": {
      "create": "SOCIETARIO.DIVIDENDO.CREATE",
      "read": "SOCIETARIO.DIVIDENDO.READ",
      "update": "SOCIETARIO.DIVIDENDO.UPDATE"
    }
  },
  {
    "key": "dividendo_pago",
    "entity": "dividendo_pago",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "dividendo-pago",
    "schema": "societario",
    "tableName": "dividendo_pago",
    "primaryKeys": [
      "id_dividendo_pago"
    ],
    "permissions": {
      "create": "SOCIETARIO.DIVIDENDO_PAGO.CREATE",
      "read": "SOCIETARIO.DIVIDENDO_PAGO.READ",
      "update": "SOCIETARIO.DIVIDENDO_PAGO.UPDATE"
    }
  },
  {
    "key": "emision_titulo",
    "entity": "emision_titulo",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "emision-titulo",
    "schema": "societario",
    "tableName": "emision_titulo",
    "primaryKeys": [
      "id_emision"
    ],
    "permissions": {
      "create": "SOCIETARIO.EMISION_TITULO.CREATE",
      "read": "SOCIETARIO.EMISION_TITULO.READ",
      "update": "SOCIETARIO.EMISION_TITULO.UPDATE"
    }
  },
  {
    "key": "tenencia",
    "entity": "tenencia",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "tenencia",
    "schema": "societario",
    "tableName": "tenencia",
    "primaryKeys": [
      "id_tenencia"
    ],
    "permissions": {
      "create": "SOCIETARIO.TENENCIA.CREATE",
      "read": "SOCIETARIO.TENENCIA.READ",
      "update": "SOCIETARIO.TENENCIA.UPDATE"
    }
  },
  {
    "key": "titular",
    "entity": "titular",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "titular",
    "schema": "societario",
    "tableName": "titular",
    "primaryKeys": [
      "id_titular"
    ],
    "permissions": {
      "create": "SOCIETARIO.TITULAR.CREATE",
      "read": "SOCIETARIO.TITULAR.READ",
      "update": "SOCIETARIO.TITULAR.UPDATE"
    }
  },
  {
    "key": "transferencia_titulo",
    "entity": "transferencia_titulo",
    "domainFolder": "societario",
    "routeModule": "societario",
    "routePath": "transferencia-titulo",
    "schema": "societario",
    "tableName": "transferencia_titulo",
    "primaryKeys": [
      "id_transferencia"
    ],
    "permissions": {
      "create": "SOCIETARIO.TRANSFERENCIA_TITULO.CREATE",
      "read": "SOCIETARIO.TRANSFERENCIA_TITULO.READ",
      "update": "SOCIETARIO.TRANSFERENCIA_TITULO.UPDATE"
    }
  }
] as const as ResourceConfig[];

export function getResourceConfig(moduleName: string, resourcePath: string): ResourceConfig | undefined {
  return RESOURCES.find((resource) => resource.routeModule === moduleName && resource.routePath === resourcePath);
}
