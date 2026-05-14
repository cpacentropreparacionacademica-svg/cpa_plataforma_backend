const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const UsuarioPermiso = sequelize.define("UsuarioPermiso", {
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "CASCADE",
      field: "id_persona"
    },
    id_permiso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "permiso", schema: "seguridad" }, key: "id_permiso" },
      onDelete: "CASCADE",
      field: "id_permiso"
    },
    permitido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "permitido"
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
    tableName: "usuario_permiso",
    freezeTableName: true,
    timestamps: false
  });

  return UsuarioPermiso;
};
