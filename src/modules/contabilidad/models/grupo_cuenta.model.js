const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const GrupoCuenta = sequelize.define("GrupoCuenta", {
    id_grupo_cuenta: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_grupo_cuenta"
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: "codigo"
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre"
    },
    id_parent: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "grupo_cuenta", schema: "contabilidad" }, key: "id_grupo_cuenta" },
      field: "id_parent"
    },
    tipo: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: "tipo"
    },
    sub_tipo: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: "sub_tipo"
    },
    sub_grupo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "sub_grupo"
    },
    orden_reporte: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: "orden_reporte"
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
    tableName: "grupo_cuenta",
    freezeTableName: true,
    timestamps: false
  });

  return GrupoCuenta;
};
