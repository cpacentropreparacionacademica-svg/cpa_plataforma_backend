const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const UnidadEducativa = sequelize.define("UnidadEducativa", {
    id_unidad_educativa: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_unidad_educativa"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
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
    categoria: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "categoria"
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
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_modificacion"
    }
  }, {
    schema: "persona",
    tableName: "unidad_educativa",
    freezeTableName: true,
    timestamps: false
  });

  return UnidadEducativa;
};
