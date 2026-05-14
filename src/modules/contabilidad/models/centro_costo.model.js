const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const CentroCosto = sequelize.define("CentroCosto", {
    id_centro_costo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_centro_costo"
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    id_cuenta_ingreso: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_ingreso"
    },
    id_cuenta_costo: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_costo"
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "observaciones"
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
    tableName: "centro_costo",
    freezeTableName: true,
    timestamps: false
  });

  return CentroCosto;
};
