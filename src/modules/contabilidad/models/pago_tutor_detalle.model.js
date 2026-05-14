const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PagoTutorDetalle = sequelize.define("PagoTutorDetalle", {
    id_pago_tutor_detalle: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_pago_tutor_detalle"
    },
    id_pago_tutor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "pago_tutor", schema: "contabilidad" }, key: "id_pago_tutor" },
      onDelete: "CASCADE",
      field: "id_pago_tutor"
    },
    id_clase: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "clase_por_hora", schema: "servicios_educativos" }, key: "id_clase" },
      field: "id_clase"
    },
    horas_pasadas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "horas_pasadas"
    },
    tarifa_hora_aplicada: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "tarifa_hora_aplicada"
    }
  }, {
    schema: "contabilidad",
    tableName: "pago_tutor_detalle",
    freezeTableName: true,
    timestamps: false
  });

  return PagoTutorDetalle;
};
