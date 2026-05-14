const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const Bien = sequelize.define("Bien", {
    id_bien: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_bien"
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      field: "sku"
    },
    nombre: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "nombre"
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion"
    },
    tipo: {
      type: DataTypes.ENUM("MERCADERIA", "MATERIA_PRIMA", "SUMINISTRO", "SERVICIO", "ACTIVO_FIJO"),
      allowNull: false,
      field: "tipo"
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "categoria"
    },
    subcategoria: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "subcategoria"
    },
    unidad_compra: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "unidad",
      field: "unidad_compra"
    },
    unidad_venta: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "unidad",
      field: "unidad_venta"
    },
    factor_conversion: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
      defaultValue: 1,
      field: "factor_conversion"
    },
    controla_inventario_loteable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "controla_inventario_loteable"
    },
    controla_inventario_no_loteable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "controla_inventario_no_loteable"
    },
    metodo_valuacion: {
      type: DataTypes.ENUM("PEPS", "UEPS", "PROM"),
      allowNull: true,
      defaultValue: "PROM",
      field: "metodo_valuacion"
    },
    costo_referencia: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "costo_referencia"
    },
    precio_referencia: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "precio_referencia"
    },
    moneda_referencia: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: "BOB",
      field: "moneda_referencia"
    },
    marca: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "marca"
    },
    modelo: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "modelo"
    },
    codigo_barras: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "codigo_barras"
    },
    peso_kg: {
      type: DataTypes.DECIMAL(18, 3),
      allowNull: true,
      field: "peso_kg"
    },
    largo_m: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "largo_m"
    },
    ancho_m: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "ancho_m"
    },
    profundidad_m: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "profundidad_m"
    },
    volumen_m3: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
      field: "volumen_m3"
    },
    id_cuenta_existencias: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_existencias"
    },
    id_cuenta_costo_venta: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_costo_venta"
    },
    id_cuenta_ingreso: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_ingreso"
    },
    id_cuenta_depreciacion: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_depreciacion"
    },
    id_cuenta_depreciacion_acumulada: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: { tableName: "cuenta", schema: "contabilidad" }, key: "id_cuenta" },
      field: "id_cuenta_depreciacion_acumulada"
    },
    valor_origen: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "valor_origen"
    },
    vida_util_meses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "vida_util_meses"
    },
    valor_residual: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      field: "valor_residual"
    },
    metodo_depreciacion: {
      type: DataTypes.ENUM("LINEA_RECTA", "SDD", "UNIDADES"),
      allowNull: true,
      field: "metodo_depreciacion"
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
    es_producto_tienda: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "es_producto_tienda"
    }
  }, {
    schema: "inventario",
    tableName: "bien",
    freezeTableName: true,
    timestamps: false
  });

  return Bien;
};
