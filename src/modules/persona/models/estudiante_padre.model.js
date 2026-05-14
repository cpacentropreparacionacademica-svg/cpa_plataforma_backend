const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const EstudiantePadre = sequelize.define("EstudiantePadre", {
    id_asociacion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_asociacion"
    },
    id_padre: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "persona_padre", schema: "persona" }, key: "id_padre" },
      field: "id_padre"
    },
    id_estudiante: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "persona_estudiante", schema: "persona" }, key: "id_persona" },
      field: "id_estudiante"
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
    tableName: "estudiante_padre",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "uq_estudiante_padre",
            unique: true,
            fields: ["id_padre", "id_estudiante"],
          },
        ]
  });

  return EstudiantePadre;
};
