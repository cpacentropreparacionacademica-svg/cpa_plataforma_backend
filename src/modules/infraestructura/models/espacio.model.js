const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Espacio = sequelize.define("Espacio", {
    id_espacio: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_espacio"
    },
    id_edificio: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "edificio", schema: "infraestructura" }, key: "id_edificio" },
      onDelete: "CASCADE",
      field: "id_edificio"
    },
    tipo: {
      type: DataTypes.ENUM("AULA", "SALA"),
      allowNull: false,
      field: "tipo"
    },
    categoria_sala: {
      type: DataTypes.ENUM("OFICINA", "CONFERENCIA", "REUNION", "ESPERA", "TIENDA", "OTRA"),
      allowNull: true,
      field: "categoria_sala"
    },
    tipo_aula: {
      type: DataTypes.ENUM("TEORIA", "LABORATORIO", "COMPUTACION", "MULTIUSO"),
      allowNull: true,
      field: "tipo_aula"
    },
    es_privada: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "es_privada"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "nombre"
    },
    piso: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: "piso"
    },
    capacidad: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: "capacidad"
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
    observaciones: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: "observaciones"
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
    tableName: "espacio",
    freezeTableName: true,
    timestamps: false
  });

  return Espacio;
};
