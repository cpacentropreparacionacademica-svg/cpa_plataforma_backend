const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const TransferenciaTitulo = sequelize.define("TransferenciaTitulo", {
    id_transferencia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_transferencia"
    },
    id_emision: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "emision_titulo", schema: "societario" }, key: "id_emision" },
      onDelete: "CASCADE",
      field: "id_emision"
    },
    id_titular_origen: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "titular", schema: "societario" }, key: "id_titular" },
      onDelete: "RESTRICT",
      field: "id_titular_origen"
    },
    id_titular_destino: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "titular", schema: "societario" }, key: "id_titular" },
      onDelete: "RESTRICT",
      field: "id_titular_destino"
    },
    cantidad: {
      type: DataTypes.DECIMAL(28, 6),
      allowNull: false,
      field: "cantidad"
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      field: "precio_unitario"
    },
    fecha_transferencia: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_transferencia"
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "motivo"
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
    tableName: "transferencia_titulo",
    freezeTableName: true,
    timestamps: false
  });

  return TransferenciaTitulo;
};
