const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  const EmpleadoRegistroPago = sequelize.define("EmpleadoRegistroPago", {
    id_pago: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: "id_pago"
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha_pago"
    },
    haber_basico_pagado: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "haber_basico_pagado"
    },
    comisiones_totales_pagadas: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "comisiones_totales_pagadas"
    },
    aguinaldos_totales_pagados: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "aguinaldos_totales_pagados"
    },
    indemnizacion_total_pagada: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "indemnizacion_total_pagada"
    },
    otros_cargos_pagados: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      field: "otros_cargos_pagados"
    },
    descripcion_otros_cargos_pagados: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "descripcion_otros_cargos_pagados"
    },
    notas_pago: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "notas_pago"
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
    tableName: "empleado_registro_pago",
    freezeTableName: true,
    timestamps: false
  });

  return EmpleadoRegistroPago;
};
