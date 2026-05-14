const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PersonaUsuario = sequelize.define("PersonaUsuario", {
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "CASCADE",
      field: "id_persona"
    },
    nombre_usuario: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: "nombre_usuario"
    },
    contrasena_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "contrasena_hash"
    },
    tipo_usuario: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "tipo_usuario"
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
    },
    es_super_usuario: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "es_super_usuario"
    }
  }, {
    schema: "persona",
    tableName: "persona_usuario",
    freezeTableName: true,
    timestamps: false
  });

  return PersonaUsuario;
};
