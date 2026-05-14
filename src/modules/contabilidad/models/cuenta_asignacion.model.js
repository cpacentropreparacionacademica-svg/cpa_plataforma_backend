const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const CuentaAsignacion = sequelize.define("CuentaAsignacion", {
    id_cuenta_asignacion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_cuenta_asignacion"
    },
    entidad_tipo: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "entidad_tipo"
    },
    id_empleado: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "id_empleado"
    },
    id_persona_estudiante: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "persona_estudiante", schema: "persona" }, key: "id_persona" },
      field: "id_persona_estudiante"
    },
    id_persona_tutor: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "persona_tutor", schema: "persona" }, key: "id_tutor" },
      field: "id_persona_tutor"
    },
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      field: "id_sucursal"
    },
    id_edificio: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "edificio", schema: "infraestructura" }, key: "id_edificio" },
      field: "id_edificio"
    },
    id_tienda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "tienda", schema: "infraestructura" }, key: "id_tienda" },
      field: "id_tienda"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_bien"
    },
    id_deuda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "deuda", schema: "deuda" }, key: "id_deuda" },
      field: "id_deuda"
    },
    id_proveedor: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "proveedor", schema: "persona" }, key: "id_proveedor" },
      field: "id_proveedor"
    },
    id_departamento: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "departamento", schema: "administracion" }, key: "id_departamento" },
      field: "id_departamento"
    },
    id_cuenta: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta"
    },
    prioridad: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      field: "prioridad"
    },
    vigente_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_DATE"),
      field: "vigente_desde"
    },
    vigente_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "vigente_hasta"
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
    }
  }, {
    schema: "contabilidad",
    tableName: "cuenta_asignacion",
    freezeTableName: true,
    timestamps: false
  });

  return CuentaAsignacion;
};
