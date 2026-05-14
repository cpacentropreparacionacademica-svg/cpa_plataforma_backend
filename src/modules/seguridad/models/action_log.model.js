const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ActionLog = sequelize.define("ActionLog", {
    id_action: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_action"
    },
    id_sesion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "sesion", schema: "seguridad" }, key: "id_sesion" },
      onDelete: "RESTRICT",
      field: "id_sesion"
    },
    tipo_accion: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "tipo_accion"
    },
    severidad: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "INFO",
      field: "severidad"
    },
    entity_schema: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "entity_schema"
    },
    entity_table: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "entity_table"
    },
    entity_pk: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "entity_pk"
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent"
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: "{}",
      field: "metadata"
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "success"
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
    schema: "seguridad",
    tableName: "action_log",
    freezeTableName: true,
    timestamps: false
  });

  return ActionLog;
};
