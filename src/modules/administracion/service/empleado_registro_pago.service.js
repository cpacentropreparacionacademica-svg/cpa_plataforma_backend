const EmpleadoRegistroPagoRepository = require("../repository/empleado_registro_pago.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EmpleadoRegistroPagoRepository,
  entityName: "empleado_registro_pago",
  serviceName: "EmpleadoRegistroPagoService",
});
