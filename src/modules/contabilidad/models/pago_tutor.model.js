const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PagoTutor = sequelize.define("PagoTutor", {
    id_pago_tutor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_pago_tutor"
    },
    id_tutor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "persona_tutor", schema: "persona" }, key: "id_tutor" },
      field: "id_tutor"
    },
    periodo_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "periodo_inicio"
    },
    periodo_fin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "periodo_fin"
    },
    estado_pago: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "BORRADOR",
      field: "estado_pago"
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "subtotal"
    },
    ajustes: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "ajustes"
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total"
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_aprobacion"
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_pago"
    },
    referencia_pago: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "referencia_pago"
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "observacion"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_modificacion"
    },
    estado_registro: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "Activo",
      field: "estado_registro"
    },
    version_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: "version_registro"
    }
  }, {
    schema: "contabilidad",
    tableName: "pago_tutor",
    freezeTableName: true,
    timestamps: false
  });

  return PagoTutor;
};
