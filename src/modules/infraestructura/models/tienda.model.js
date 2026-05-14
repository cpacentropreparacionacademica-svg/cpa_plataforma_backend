const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Tienda = sequelize.define("Tienda", {
    id_tienda: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_tienda"
    },
    id_espacio: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
      references: { model: { tableName: "espacio", schema: "infraestructura" }, key: "id_espacio" },
      onDelete: "SET NULL",
      field: "id_espacio"
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
    horario_texto: {
      type: DataTypes.STRING(240),
      allowNull: true,
      field: "horario_texto"
    },
    id_responsable: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "persona", schema: "persona" }, key: "id_persona" },
      field: "id_responsable"
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
    tableName: "tienda",
    freezeTableName: true,
    timestamps: false
  });

  return Tienda;
};
