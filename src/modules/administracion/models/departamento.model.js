const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Departamento = sequelize.define("Departamento", {
    id_departamento: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_departamento"
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "nombre"
    },
    descripcion_funciones: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: "descripcion_funciones"
    },
    id_departamento_padre: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "departamento", schema: "administracion" }, key: "id_departamento" },
      onDelete: "SET NULL",
      field: "id_departamento_padre"
    },
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      onDelete: "SET NULL",
      field: "id_sucursal"
    },
    id_jefe_empleado: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      onDelete: "SET NULL",
      field: "id_jefe_empleado"
    },
    es_activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "es_activo"
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
    tableName: "departamento",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "uq_dep_sucursal_nombre",
            unique: true,
            fields: ["id_sucursal", "nombre"],
          },
        ]
  });
  
  return Departamento;
};
