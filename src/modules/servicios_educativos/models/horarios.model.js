const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Horarios = sequelize.define("Horarios", {
    id_horario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_horario"
    },
    repeticion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "repeticion"
    },
    hora_inicio_lunes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_lunes"
    },
    hora_inicio_martes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_martes"
    },
    hora_inicio_miercoles: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_miercoles"
    },
    hora_inicio_jueves: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_jueves"
    },
    hora_inicio_viernes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_viernes"
    },
    hora_inicio_sabado: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_inicio_sabado"
    },
    hora_fin_lunes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_lunes"
    },
    hora_fin_martes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_martes"
    },
    hora_fin_miercoles: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_miercoles"
    },
    hora_fin_jueves: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_jueves"
    },
    hora_fin_viernes: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_viernes"
    },
    hora_fin_sabado: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "hora_fin_sabado"
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal("now()"),
      field: "fecha_registro"
    },
    estado_registro: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: "estado_registro"
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
    }
  }, {
    schema: "servicios_educativos",
    tableName: "horarios",
    freezeTableName: true,
    timestamps: false
  });

  return Horarios;
};
