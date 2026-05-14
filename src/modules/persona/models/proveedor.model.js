const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Proveedor = sequelize.define("Proveedor", {
    id_proveedor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_proveedor"
    },
    nombre_proveedor: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "nombre_proveedor"
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "categoria"
    },
    telefono: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "telefono"
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
    schema: "persona",
    tableName: "proveedor",
    freezeTableName: true,
    timestamps: false
  });

  return Proveedor;
};
