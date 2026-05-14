const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Empleado = sequelize.define("Empleado", {
    id_empleado: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_empleado"
    },
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      onDelete: "RESTRICT",
      field: "id_persona"
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_ingreso"
    },
    fecha_salida: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_salida"
    },
    tipo_contrato: {
      type: DataTypes.ENUM("INDEFINIDO", "PLAZO_FIJO", "HONORARIOS"),
      allowNull: false,
      defaultValue: "INDEFINIDO",
      field: "tipo_contrato"
    },
    jornada: {
      type: DataTypes.ENUM("FULL_TIME", "PART_TIME"),
      allowNull: false,
      defaultValue: "FULL_TIME",
      field: "jornada"
    },
    email_corporativo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "email_corporativo"
    },
    telefono_corporativo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "telefono_corporativo"
    },
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      field: "id_sucursal"
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
    schema: "administracion",
    tableName: "empleado",
    freezeTableName: true,
    timestamps: false
  });

  return Empleado;
};
