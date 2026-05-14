const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const PersonaTutor = sequelize.define("PersonaTutor", {
    id_tutor: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_tutor"
    },
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "CASCADE",
      field: "id_persona"
    },
    pago_por_hora: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "pago_por_hora"
    },
    nivel_experiencia: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "nivel_experiencia"
    },
    tipo_estudiante_especialidad: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "tipo_estudiante_especialidad"
    },
    nivel_estudiante_especialidad: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "nivel_estudiante_especialidad"
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
      field: "fecha_modificacion"
    }
  }, {
    schema: "persona",
    tableName: "persona_tutor",
    freezeTableName: true,
    timestamps: false
  });

  return PersonaTutor;
};
