const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Titular = sequelize.define("Titular", {
    id_titular: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_titular"
    },
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "RESTRICT",
      field: "id_persona"
    },
    es_beneficial_owner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "es_beneficial_owner"
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
    schema: "societario",
    tableName: "titular",
    freezeTableName: true,
    timestamps: false
  });

  return Titular;
};
