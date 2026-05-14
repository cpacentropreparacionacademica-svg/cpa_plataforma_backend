const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Posicion = sequelize.define("Posicion", {
    id_posicion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_posicion"
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    id_posicion_parent: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "posicion", schema: "administracion" }, key: "id_posicion" },
      field: "id_posicion_parent"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
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
    tableName: "posicion",
    freezeTableName: true,
    timestamps: false
  });

  return Posicion;
};
