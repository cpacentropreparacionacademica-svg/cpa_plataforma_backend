const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Sesion = sequelize.define("Sesion", {
    id_sesion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_sesion"
    },
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      field: "id_persona"
    },
    ip_acceso: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "ip_acceso"
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent"
    },
    tipo_login: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "tipo_login"
    },
    tipo_logout: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "tipo_logout"
    },
    timestamp_login: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("now()"),
      field: "timestamp_login"
    },
    timestamp_logout: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "timestamp_logout"
    },
    esta_activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "esta_activa"
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: "{}",
      field: "metadata"
    }
  }, {
    schema: "seguridad",
    tableName: "sesion",
    freezeTableName: true,
    timestamps: false
  });

  return Sesion;
};
