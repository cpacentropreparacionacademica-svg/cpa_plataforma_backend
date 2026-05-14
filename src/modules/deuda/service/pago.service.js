const PagoRepository = require("../repository/pago.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PagoRepository,
  entityName: "pago",
  serviceName: "PagoService",
});
