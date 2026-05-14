const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Persona = sequelize.define("Persona", {
    id_persona: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_persona"
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "nombres"
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "apellidos"
    },
    telefono: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "telefono"
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "fecha_nacimiento"
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "email"
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
    schema: "persona",
    tableName: "persona",
    freezeTableName: true,
    timestamps: false
  });

  return Persona;
};
