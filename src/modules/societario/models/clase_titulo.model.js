const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ClaseTitulo = sequelize.define("ClaseTitulo", {
    id_clase_titulo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_clase_titulo"
    },
    tipo: {
      type: DataTypes.ENUM("ACCION", "CUOTA", "PARTICIPACION", "BONO_CONVERTIBLE", "SAFE", "WARRANT", "OPCION"),
      allowNull: false,
      defaultValue: "ACCION",
      field: "tipo"
    },
    sub_tipo: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: "sub_tipo"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    valor_nominal: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      field: "valor_nominal"
    },
    derechos_voto_por_titulo: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      defaultValue: 1.0,
      field: "derechos_voto_por_titulo"
    },
    prioridad_dividendo_bp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "prioridad_dividendo_bp"
    },
    pref_liquidacion_x: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      field: "pref_liquidacion_x"
    },
    es_convertible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "es_convertible"
    },
    es_participante: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "es_participante"
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
    schema: "societario",
    tableName: "clase_titulo",
    freezeTableName: true,
    timestamps: false,
    indexes: [
          {
            name: "clase_titulo_tipo_sub_tipo_key",
            unique: true,
            fields: ["tipo", "sub_tipo"],
          },
        ]
  });

  return ClaseTitulo;
};
