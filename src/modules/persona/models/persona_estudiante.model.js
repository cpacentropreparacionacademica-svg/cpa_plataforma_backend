const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PersonaEstudiante = sequelize.define("PersonaEstudiante", {
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "CASCADE",
      field: "id_persona"
    },
    codigo_estudiante: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "codigo_estudiante"
    },
    id_unidad_educativa: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "unidad_educativa", schema: "persona" }, key: "id_unidad_educativa" },
      field: "id_unidad_educativa"
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "tipo"
    },
    nivel_actual: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "nivel_actual"
    },
    curso_actual: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "curso_actual"
    },
    turno_actual: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "turno_actual"
    },
    carrera: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "carrera"
    },
    anio_ingreso: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: "anio_ingreso"
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
    schema: "persona",
    tableName: "persona_estudiante",
    freezeTableName: true,
    timestamps: false
  });

  return PersonaEstudiante;
};
