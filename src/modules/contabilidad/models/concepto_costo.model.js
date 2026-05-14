const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ConceptoCosto = sequelize.define("ConceptoCosto", {
    id_concepto: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_concepto"
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: "nombre"
    },
    tipo_concepto: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: "tipo_concepto"
    },
    unidad_medida: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "unidad_medida"
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
    schema: "contabilidad",
    tableName: "concepto_costo",
    freezeTableName: true,
    timestamps: false
  });

  return ConceptoCosto;
};
