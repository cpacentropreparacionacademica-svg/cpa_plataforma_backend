const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Kpi = sequelize.define("Kpi", {
    id_kpi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_kpi"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    unidad_medida: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "unidad_medida"
    },
    frecuencia: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "frecuencia"
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
    tableName: "kpi",
    freezeTableName: true,
    timestamps: false
  });

  return Kpi;
};
