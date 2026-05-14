const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Rol = sequelize.define("Rol", {
    id_rol: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_rol"
    },
    codigo: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "nombre"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    estado_registro: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Activo",
      field: "estado_registro"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
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
    schema: "seguridad",
    tableName: "rol",
    freezeTableName: true,
    timestamps: false
  });

  return Rol;
};
