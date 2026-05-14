const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const BienInstancia = sequelize.define("BienInstancia", {
    id_bien_instancia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_bien_instancia"
    },
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      onDelete: "CASCADE",
      field: "id_bien"
    },
    descripcion_especificaciones: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "descripcion_especificaciones"
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
    costo_compra: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "costo_compra"
    },
    precio_compra: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "precio_compra"
    },
    serial_unico: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "serial_unico"
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
    tableName: "bien_instancia",
    freezeTableName: true,
    timestamps: false
  });

  return BienInstancia;
};
