const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ClaseCurso = sequelize.define("ClaseCurso", {
    id_clase_curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_clase_curso"
    },
    id_curso_version: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "curso_version", schema: "servicios_educativos" }, key: "id_curso_version" },
      onDelete: "CASCADE",
      field: "id_curso_version"
    },
    id_aula: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "espacio", schema: "infraestructura" }, key: "id_espacio" },
      onDelete: "SET NULL",
      field: "id_aula"
    },
    id_tutor: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      onDelete: "SET NULL",
      field: "id_tutor"
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha"
    },
    hora_inicio_real: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_inicio_real"
    },
    hora_fin_real: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_fin_real"
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Programada",
      field: "estado"
    },
    modalidad: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "Presencial",
      field: "modalidad"
    },
    detalle_temas_revisados: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "detalle_temas_revisados"
    },
    observaciones: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: "observaciones"
    },
    motivo_cancelacion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "motivo_cancelacion"
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
    tableName: "clase_curso",
    freezeTableName: true,
    timestamps: false
  });

  return ClaseCurso;
};
