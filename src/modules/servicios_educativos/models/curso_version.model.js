const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const CursoVersion = sequelize.define("CursoVersion", {
    id_curso_version: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_curso_version"
    },
    id_producto_educativo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "producto_educativo", schema: "servicios_educativos" }, key: "id_producto_educativo" },
      onDelete: "CASCADE",
      field: "id_producto_educativo"
    },
    nombre_version: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre_version"
    },
    descripcion_version: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion_version"
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_inicio"
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_fin"
    },
    precio_version: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: "precio_version"
    },
    id_horario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "horarios", schema: "servicios_educativos" }, key: "id_horario" },
      field: "id_horario"
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
    tableName: "curso_version",
    freezeTableName: true,
    timestamps: false
  });

  return CursoVersion;
};
