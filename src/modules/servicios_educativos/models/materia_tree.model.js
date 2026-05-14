const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const MateriaTree = sequelize.define("MateriaTree", {
    id_tree: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_tree"
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "nombre"
    },
    tema: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "tema"
    },
    subtema: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "subtema"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
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
    estado_registro: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "estado_registro"
    },
    fecha_modificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_modificacion"
    }
  }, {
    schema: "servicios_educativos",
    tableName: "materia_tree",
    freezeTableName: true,
    timestamps: false
  });

  return MateriaTree;
};
