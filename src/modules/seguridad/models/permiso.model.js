const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Permiso = sequelize.define("Permiso", {
    id_permiso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_permiso"
    },
    codigo: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    modulo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "modulo"
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
    tableName: "permiso",
    freezeTableName: true,
    timestamps: false
  });

  return Permiso;
};
