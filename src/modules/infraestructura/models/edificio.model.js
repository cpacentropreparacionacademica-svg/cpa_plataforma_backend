const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Edificio = sequelize.define("Edificio", {
    id_edificio: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_edificio"
    },
    id_sucursal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      onDelete: "CASCADE",
      field: "id_sucursal"
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
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
    latitud: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      field: "latitud"
    },
    longitud: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      field: "longitud"
    },
    pisos: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: "pisos"
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
    id_administrador: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "id_administrador"
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
    tableName: "edificio",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "uq_edificio_sucursal_codigo",
            unique: true,
            fields: ["id_sucursal", "codigo"],
          },
        ]
  });

  return Edificio;
};
