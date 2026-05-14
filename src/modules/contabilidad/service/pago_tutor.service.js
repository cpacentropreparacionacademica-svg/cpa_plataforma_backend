const PagoTutorRepository = require("../repository/pago_tutor.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PagoTutorRepository,
  entityName: "pago_tutor",
  serviceName: "PagoTutorService",
});
