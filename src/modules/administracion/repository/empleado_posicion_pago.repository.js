const { EmpleadoPosicionPago } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: EmpleadoPosicionPago,
  entity: "empleado_posicion_pago",
  primaryKeys: ["id_empleado_posicion"],
});
