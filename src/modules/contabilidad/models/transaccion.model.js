const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Transaccion = sequelize.define("Transaccion", {
    id_transaccion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_transaccion"
    },
    fecha_transaccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_transaccion"
    },
    tipo_transaccion: {
      type: DataTypes.ENUM("GENERAL", "COSTO", "VENTA", "BIEN", "DEUDA"),
      allowNull: false,
      field: "tipo_transaccion"
    },
    sub_tipo_transaccion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "sub_tipo_transaccion"
    },
    glosa: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: "glosa"
    },
    id_centro_costo_mapa: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "centro_costo_mapa", schema: "contabilidad" }, key: "id_cc_mapa" },
      field: "id_centro_costo_mapa"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_bien"
    },
    id_movimiento_detalle: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "movimiento_detalle", schema: "inventario" }, key: "id_movimiento" },
      field: "id_movimiento_detalle"
    },
    id_deuda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "deuda", schema: "deuda" }, key: "id_deuda" },
      field: "id_deuda"
    },
    id_pago_deuda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "pago", schema: "deuda" }, key: "id_pago" },
      field: "id_pago_deuda"
    },
    id_empleado: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "id_empleado"
    },
    id_empleado_pago: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado_registro_pago", schema: "administracion" }, key: "id_pago" },
      field: "id_empleado_pago"
    },
    id_departamento: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "departamento", schema: "administracion" }, key: "id_departamento" },
      field: "id_departamento"
    },
    id_clase_por_hora: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "clase_por_hora", schema: "servicios_educativos" }, key: "id_clase" },
      field: "id_clase_por_hora"
    },
    id_producto_educativo: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "producto_educativo", schema: "servicios_educativos" }, key: "id_producto_educativo" },
      field: "id_producto_educativo"
    },
    id_curso_version: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "curso_version", schema: "servicios_educativos" }, key: "id_curso_version" },
      field: "id_curso_version"
    },
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      field: "id_sucursal"
    },
    id_tienda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "tienda", schema: "infraestructura" }, key: "id_tienda" },
      field: "id_tienda"
    },
    id_proveedor: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "proveedor", schema: "persona" }, key: "id_proveedor" },
      field: "id_proveedor"
    },
    id_dividendo_pago: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "dividendo_pago", schema: "societario" }, key: "id_dividendo_pago" },
      field: "id_dividendo_pago"
    },
    id_emision_titulo: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "emision_titulo", schema: "societario" }, key: "id_emision" },
      field: "id_emision_titulo"
    },
    estado_registro: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Activo",
      field: "estado_registro"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_modificacion"
    },
    version_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: "version_registro"
    },
    id_usuario_creador: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_usuario_creador"
    },
    id_usuario_modificacion: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_usuario_modificacion"
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      field: "id_cliente"
    },
    id_pago_tutor: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "pago_tutor", schema: "contabilidad" }, key: "id_pago_tutor" },
      field: "id_pago_tutor"
    }
  }, {
    schema: "contabilidad",
    tableName: "transaccion",
    freezeTableName: true,
    timestamps: false
  });

  return Transaccion;
};
