const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Cuenta = sequelize.define("Cuenta", {
    id_cuenta: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_cuenta"
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre_cuenta: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "nombre_cuenta"
    },
    id_grupo_cuenta: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "grupo_cuenta", schema: "contabilidad" }, key: "id_grupo_cuenta" },
      field: "id_grupo_cuenta"
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
    tableName: "cuenta",
    freezeTableName: true,
    timestamps: false
  });

  return Cuenta;
};
