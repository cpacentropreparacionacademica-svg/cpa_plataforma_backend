const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const UsuarioTokenAccion = sequelize.define("UsuarioTokenAccion", {
    id_token_accion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_token_accion"
    },
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: { tableName: "persona_usuario", schema: "persona" },
        key: "id_persona"
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      field: "id_persona"
    },
    accion: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: "accion"
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "token_hash"
    },
    fecha_expiracion: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "fecha_expiracion"
    },
    fecha_usado: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_usado"
    },
    fecha_revocado: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_revocado"
    },
    estado_registro: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Activo",
      field: "estado_registro"
    },
    id_usuario_creador: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "id_usuario_creador"
    }
  }, {
    schema: "seguridad",
    tableName: "usuario_token_accion",
    freezeTableName: true,
    timestamps: false
  });

  return UsuarioTokenAccion;
};