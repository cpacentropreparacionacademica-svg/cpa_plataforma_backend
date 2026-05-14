const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const CentroCostoMapa = sequelize.define("CentroCostoMapa", {
    id_cc_mapa: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_cc_mapa"
    },
    id_centro_costo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "centro_costo", schema: "contabilidad" }, key: "id_centro_costo" },
      field: "id_centro_costo"
    },
    tipo: {
      type: DataTypes.ENUM("DIRECTO", "INDIRECTO"),
      allowNull: false,
      field: "tipo"
    },
    naturaleza: {
      type: DataTypes.ENUM("FIJO", "VARIABLE"),
      allowNull: false,
      field: "naturaleza"
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
    id_deuda: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "deuda", schema: "deuda" }, key: "id_deuda" },
      field: "id_deuda"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_bien"
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
    id_empleado: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "id_empleado"
    },
    id_posicion: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "posicion", schema: "administracion" }, key: "id_posicion" },
      field: "id_posicion"
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
    id_departamento: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "departamento", schema: "administracion" }, key: "id_departamento" },
      field: "id_departamento"
    }
  }, {
    schema: "contabilidad",
    tableName: "centro_costo_mapa",
    freezeTableName: true,
    timestamps: false
  });

  return CentroCostoMapa;
};
