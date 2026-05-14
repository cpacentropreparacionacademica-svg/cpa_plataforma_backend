const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Encargado = sequelize.define("Encargado", {
    id_asignacion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_asignacion"
    },
    id_sucursal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      field: "id_sucursal"
    },
    id_empleado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "id_empleado"
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_inicio"
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_fin"
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
    schema: "infraestructura",
    tableName: "encargado",
    freezeTableName: true,
    timestamps: false
  });

  return Encargado;
};
