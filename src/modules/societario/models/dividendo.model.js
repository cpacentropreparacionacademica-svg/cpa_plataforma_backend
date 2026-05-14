const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Dividendo = sequelize.define("Dividendo", {
    id_dividendo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_dividendo"
    },
    id_clase_titulo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "clase_titulo", schema: "societario" }, key: "id_clase_titulo" },
      onDelete: "RESTRICT",
      field: "id_clase_titulo"
    },
    fecha_declaracion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_declaracion"
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_pago"
    },
    monto_total: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "monto_total"
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
    tableName: "dividendo",
    freezeTableName: true,
    timestamps: false
  });

  return Dividendo;
};
