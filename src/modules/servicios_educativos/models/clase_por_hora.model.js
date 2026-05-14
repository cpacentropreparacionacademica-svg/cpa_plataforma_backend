const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ClasePorHora = sequelize.define("ClasePorHora", {
    id_clase: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_clase"
    },
    id_aula: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "espacio", schema: "infraestructura" }, key: "id_espacio" },
      field: "id_aula"
    },
    id_estudiante: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "persona_estudiante", schema: "persona" }, key: "id_persona" },
      field: "id_estudiante"
    },
    id_tutor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "persona_tutor", schema: "persona" }, key: "id_tutor" },
      field: "id_tutor"
    },
    id_materia_tree: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "materia_tree", schema: "servicios_educativos" }, key: "id_tree" },
      field: "id_materia_tree"
    },
    hora_llegada: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "hora_llegada"
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "motivo"
    },
    modalidad: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "PRESENCIAL",
      field: "modalidad"
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
    hora_salida: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "hora_salida"
    },
    estado_operativo: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "ABIERTA",
      field: "estado_operativo"
    }
  }, {
    schema: "servicios_educativos",
    tableName: "clase_por_hora",
    freezeTableName: true,
    timestamps: false
  });

  return ClasePorHora;
};
