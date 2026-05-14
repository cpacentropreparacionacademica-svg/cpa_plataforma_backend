const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PaquetesProductoEducativo = sequelize.define("PaquetesProductoEducativo", {
    id_paquete: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_paquete"
    },
    nombre_paquete: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre_paquete"
    },
    cantidad_horas_paquete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "cantidad_horas_paquete"
    },
    precio_paquete: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "precio_paquete"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    estado_registro: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "estado_registro"
    },
    id_usuario: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_usuario"
    },
    id_usuario_modificacion: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_usuario_modificacion"
    },
    version_registro: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: "version_registro"
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_modificacion"
    }
  }, {
    schema: "servicios_educativos",
    tableName: "paquetes_producto_educativo",
    freezeTableName: true,
    timestamps: false
  });

  return PaquetesProductoEducativo;
};
