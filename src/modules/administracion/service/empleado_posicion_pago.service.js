const EmpleadoPosicionPagoRepository = require("../repository/empleado_posicion_pago.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EmpleadoPosicionPagoRepository,
  entityName: "empleado_posicion_pago",
  serviceName: "EmpleadoPosicionPagoService",
});
