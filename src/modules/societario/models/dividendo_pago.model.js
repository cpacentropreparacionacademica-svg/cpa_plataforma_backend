const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const DividendoPago = sequelize.define("DividendoPago", {
    id_dividendo_pago: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_dividendo_pago"
    },
    id_dividendo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "dividendo", schema: "societario" }, key: "id_dividendo" },
      onDelete: "CASCADE",
      field: "id_dividendo"
    },
    id_titular: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "titular", schema: "societario" }, key: "id_titular" },
      onDelete: "RESTRICT",
      field: "id_titular"
    },
    monto_pagado: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "monto_pagado"
    },
    fecha_pago_real: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_pago_real"
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
    tableName: "dividendo_pago",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "dividendo_pago_id_dividendo_id_titular_key",
            unique: true,
            fields: ["id_dividendo", "id_titular"],
          },
        ]
  });

  return DividendoPago;
};
