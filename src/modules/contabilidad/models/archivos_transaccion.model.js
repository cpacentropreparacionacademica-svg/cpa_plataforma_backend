const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ArchivosTransaccion = sequelize.define("ArchivosTransaccion", {
    id_archivo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_archivo"
    },
    id_transaccion: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "transaccion", schema: "contabilidad" }, key: "id_transaccion" },
      field: "id_transaccion"
    },
    link_achivo: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "link_achivo"
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
    },
    link_archivo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "link_archivo"
    }
  }, {
    schema: "contabilidad",
    tableName: "archivos_transaccion",
    freezeTableName: true,
    timestamps: false
  });

  return ArchivosTransaccion;
};
