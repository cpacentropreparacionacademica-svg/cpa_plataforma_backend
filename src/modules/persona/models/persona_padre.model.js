const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PersonaPadre = sequelize.define("PersonaPadre", {
    id_padre: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_padre"
    },
    es_embajador: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "es_embajador"
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "metadata"
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
    schema: "persona",
    tableName: "persona_padre",
    freezeTableName: true,
    timestamps: false
  });

  return PersonaPadre;
};
