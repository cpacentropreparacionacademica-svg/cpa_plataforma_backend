const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ProductoEducativo = sequelize.define("ProductoEducativo", {
    id_producto_educativo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_producto_educativo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    tipo_producto: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "tipo_producto"
    },
    precio_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: "precio_base"
    },
    lim_sup_estudiantes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: "lim_sup_estudiantes"
    },
    lim_inf_estudiantes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "lim_inf_estudiantes"
    },
    id_producto_tienda: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_producto_tienda"
    },
    link_bibliografia: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "link_bibliografia"
    },
    link_publicidad: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "link_publicidad"
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
    tableName: "producto_educativo",
    freezeTableName: true,
    timestamps: false
  });

  return ProductoEducativo;
};
