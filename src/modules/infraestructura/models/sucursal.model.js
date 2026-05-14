const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Sucursal = sequelize.define("Sucursal", {
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_sucursal"
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    telefono: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "telefono"
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "email"
    },
    direccion_linea1: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: "direccion_linea1"
    },
    ciudad: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "ciudad"
    },
    departamento: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "departamento"
    },
    pais: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "pais"
    },
    horario_texto: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: "horario_texto"
    },
    largo_m: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: "largo_m"
    },
    ancho_m: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: "ancho_m"
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
    tableName: "sucursal",
    freezeTableName: true,
    timestamps: false
  });

  return Sucursal;
};
