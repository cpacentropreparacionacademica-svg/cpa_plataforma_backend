const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Pago = sequelize.define("Pago", {
    id_pago: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_pago"
    },
    id_deuda: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "deuda", schema: "deuda" }, key: "id_deuda" },
      onDelete: "CASCADE",
      field: "id_deuda"
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_DATE"),
      field: "fecha_pago"
    },
    interes_pagado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
      field: "interes_pagado"
    },
    capital_amortizado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
      field: "capital_amortizado"
    },
    seguro_desgravamen_pagado: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
      field: "seguro_desgravamen_pagado"
    },
    otros_recargos_pagados: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
      field: "otros_recargos_pagados"
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "observaciones"
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
    }
  }, {
    schema: "deuda",
    tableName: "pago",
    freezeTableName: true,
    timestamps: false
  });

  return Pago;
};
