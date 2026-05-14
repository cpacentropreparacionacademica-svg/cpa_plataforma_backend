const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const AsistenciaClaseCurso = sequelize.define("AsistenciaClaseCurso", {
    id_asistencia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_asistencia"
    },
    id_clase_curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "clase_curso", schema: "servicios_educativos" }, key: "id_clase_curso" },
      onDelete: "CASCADE",
      field: "id_clase_curso"
    },
    id_estudiante: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "persona_estudiante", schema: "persona" }, key: "id_persona" },
      onDelete: "RESTRICT",
      field: "id_estudiante"
    },
    estado_asistencia: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: "estado_asistencia"
    },
    hora_marcacion: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "hora_marcacion"
    },
    observaciones: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: "observaciones"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    estado_registro: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "estado_registro"
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
    }
  }, {
    schema: "servicios_educativos",
    tableName: "asistencia_clase_curso",
    freezeTableName: true,
    timestamps: false,
    indexes: [,
          {
            name: "uq_asistencia_unica",
            unique: true,
            fields: ["id_clase_curso", "id_estudiante"],
          },
        ]
  });

  return AsistenciaClaseCurso;
};
