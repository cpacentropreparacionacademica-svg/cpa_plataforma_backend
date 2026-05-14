const PagoTutorDetalleRepository = require("../repository/pago_tutor_detalle.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PagoTutorDetalleRepository,
  entityName: "pago_tutor_detalle",
  serviceName: "PagoTutorDetalleService",
});
