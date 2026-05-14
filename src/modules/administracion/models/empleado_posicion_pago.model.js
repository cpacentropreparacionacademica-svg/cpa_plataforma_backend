const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const EmpleadoPosicionPago = sequelize.define("EmpleadoPosicionPago", {
    id_empleado_posicion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_empleado_posicion"
    },
    id_empleado: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      onDelete: "CASCADE",
      field: "id_empleado"
    },
    id_posicion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "posicion", schema: "administracion" }, key: "id_posicion" },
      onDelete: "RESTRICT",
      field: "id_posicion"
    },
    vigente_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_DATE"),
      field: "vigente_desde"
    },
    vigente_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "vigente_hasta"
    },
    tipo_esquema_pago: {
      type: DataTypes.ENUM("SUELDO", "POR_HORA", "COMISION", "MIXTO"),
      allowNull: false,
      field: "tipo_esquema_pago"
    },
    frecuencia_pago: {
      type: DataTypes.ENUM("MENSUAL", "QUINCENAL", "SEMANAL"),
      allowNull: false,
      defaultValue: "MENSUAL",
      field: "frecuencia_pago"
    },
    moneda: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: "BOB",
      field: "moneda"
    },
    pago_por_hora: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "pago_por_hora"
    },
    sueldo_mensual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "sueldo_mensual"
    },
    porcentaje_comision: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "porcentaje_comision"
    },
    comision_fija: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "comision_fija"
    },
    tipo_comisionable: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "tipo_comisionable"
    },
    tipo_calculo_comisionable: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "tipo_calculo_comisionable"
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
    schema: "administracion",
    tableName: "empleado_posicion_pago",
    freezeTableName: true,
    timestamps: false
  });

  return EmpleadoPosicionPago;
};
