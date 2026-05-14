const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const EmisionTitulo = sequelize.define("EmisionTitulo", {
    id_emision: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_emision"
    },
    id_clase_titulo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "clase_titulo", schema: "societario" }, key: "id_clase_titulo" },
      onDelete: "CASCADE",
      field: "id_clase_titulo"
    },
    ronda: {
      type: DataTypes.ENUM("FOUNDERS", "ANGEL", "SEED", "A", "B", "C", "D", "PUENTE", "OTRA"),
      allowNull: true,
      defaultValue: "OTRA",
      field: "ronda"
    },
    instrumento: {
      type: DataTypes.ENUM("AUMENTO_CAPITAL", "CONVERSION", "PLAN_OPCIONES", "EMISION_SECUNDARIA", "OTRO"),
      allowNull: false,
      defaultValue: "AUMENTO_CAPITAL",
      field: "instrumento"
    },
    serie: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "serie"
    },
    fecha_emision: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_emision"
    },
    cantidad_autorizada: {
      type: DataTypes.DECIMAL(28, 6),
      allowNull: false,
      field: "cantidad_autorizada"
    },
    cantidad_emitida: {
      type: DataTypes.DECIMAL(28, 6),
      allowNull: false,
      field: "cantidad_emitida"
    },
    precio_emision: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      field: "precio_emision"
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
    tableName: "emision_titulo",
    freezeTableName: true,
    timestamps: false
  });

  return EmisionTitulo;
};
