const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Deuda = sequelize.define("Deuda", {
    id_deuda: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_deuda"
    },
    id_proveedor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "proveedor", schema: "persona" }, key: "id_proveedor" },
      onDelete: "RESTRICT",
      field: "id_proveedor"
    },
    monto_inicial: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "monto_inicial"
    },
    tasa_anual: {
      type: DataTypes.DECIMAL(6, 4),
      allowNull: false,
      field: "tasa_anual"
    },
    tipo_tasa: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "tipo_tasa"
    },
    capitalizacion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "capitalizacion"
    },
    plazo_meses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "plazo_meses"
    },
    seguro_desgravamen_fijo: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "seguro_desgravamen_fijo"
    },
    seguro_desgravamen_variable: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "seguro_desgravamen_variable"
    },
    tipo_calculo_cuotas: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "FRANCES",
      field: "tipo_calculo_cuotas"
    },
    frecuencia_cuotas: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "MENSUAL",
      field: "frecuencia_cuotas"
    },
    tipo_pago: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "VENCIDAS",
      field: "tipo_pago"
    },
    tipo_primer_pago: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "INMEDIATA",
      field: "tipo_primer_pago"
    },
    anualidad_acordada: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "anualidad_acordada"
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_DATE"),
      field: "fecha_inicio"
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
    tableName: "deuda",
    freezeTableName: true,
    timestamps: false
  });

  return Deuda;
};
