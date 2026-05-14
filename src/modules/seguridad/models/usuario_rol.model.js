const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const UsuarioRol = sequelize.define("UsuarioRol", {
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "CASCADE",
      field: "id_persona"
    },
    id_rol: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "rol", schema: "seguridad" }, key: "id_rol" },
      onDelete: "CASCADE",
      field: "id_rol"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    estado_registro: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Activo",
      field: "estado_registro"
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
    tableName: "usuario_rol",
    freezeTableName: true,
    timestamps: false
  });

  return UsuarioRol;
};
