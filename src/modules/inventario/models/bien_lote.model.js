const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const BienLote = sequelize.define("BienLote", {
    id_lote: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_lote"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      onDelete: "CASCADE",
      field: "id_bien"
    },
    lote_codigo: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: "lote_codigo"
    },
    fecha_compra: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_compra"
    },
    id_proveedor_compra: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "proveedor", schema: "persona" }, key: "id_proveedor" },
      field: "id_proveedor_compra"
    },
    cantidad_compra: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cantidad_compra"
    },
    costo_compra_unitario: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "costo_compra_unitario"
    },
    precio_compra_unitario: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "precio_compra_unitario"
    },
    fecha_fabricacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_fabricacion"
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_vencimiento"
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
    schema: "inventario",
    tableName: "bien_lote",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "bien_lote_id_bien_lote_codigo_key",
            unique: true,
            fields: ["id_bien", "lote_codigo"],
          },
        ]
  });

  return BienLote;
};
