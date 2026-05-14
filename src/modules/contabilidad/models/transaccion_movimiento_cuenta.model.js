const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const TransaccionMovimientoCuenta = sequelize.define("TransaccionMovimientoCuenta", {
    id_movimiento: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_movimiento"
    },
    id_transaccion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "transaccion", schema: "contabilidad" }, key: "id_transaccion" },
      field: "id_transaccion"
    },
    id_cuenta: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta"
    },
    debe: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "debe"
    },
    haber: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "haber"
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
    schema: "contabilidad",
    tableName: "transaccion_movimiento_cuenta",
    freezeTableName: true,
    timestamps: false
  });

  return TransaccionMovimientoCuenta;
};
