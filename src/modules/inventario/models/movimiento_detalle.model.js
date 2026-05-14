const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const MovimientoDetalle = sequelize.define("MovimientoDetalle", {
    id_movimiento: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_movimiento"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_bien"
    },
    id_lote: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "bien_lote", schema: "inventario" }, key: "id_lote" },
      field: "id_lote"
    },
    id_bien_instancia: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "bien_instancia", schema: "inventario" }, key: "id_bien_instancia" },
      field: "id_bien_instancia"
    },
    cantidad: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      defaultValue: 1,
      field: "cantidad"
    },
    id_espacio_entrada: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_espacio_entrada"
    },
    id_espacio_salida: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_espacio_salida"
    }
  }, {
    schema: "inventario",
    tableName: "movimiento_detalle",
    freezeTableName: true,
    timestamps: false
  });

  return MovimientoDetalle;
};
