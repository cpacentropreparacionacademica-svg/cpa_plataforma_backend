const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const ObjetivoKpi = sequelize.define("ObjetivoKpi", {
    id_objetivo_kpi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_objetivo_kpi"
    },
    id_kpi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: { tableName: "kpi", schema: "administracion" }, key: "id_kpi" },
      onDelete: "CASCADE",
      field: "id_kpi"
    },
    periodo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "periodo"
    },
    valor_meta: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      field: "valor_meta"
    },
    valor_minimo: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "valor_minimo"
    },
    valor_maximo: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "valor_maximo"
    },
    responsable: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "empleado", schema: "administracion" }, key: "id_empleado" },
      field: "responsable"
    },
    id_sucursal: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "sucursal", schema: "infraestructura" }, key: "id_sucursal" },
      field: "id_sucursal"
    },
    id_tienda: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "tienda", schema: "infraestructura" }, key: "id_tienda" },
      field: "id_tienda"
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "producto_educativo", schema: "servicios_educativos" }, key: "id_producto_educativo" },
      field: "id_producto"
    },
    id_producto_tienda: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: { tableName: "bien", schema: "inventario" }, key: "id_bien" },
      field: "id_producto_tienda"
    },
    cumplido: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "cumplido"
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
    tableName: "objetivo_kpi",
    freezeTableName: true,
    timestamps: false
  });

  return ObjetivoKpi;
};
