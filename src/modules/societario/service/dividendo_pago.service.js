const DividendoPagoRepository = require("../repository/dividendo_pago.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: DividendoPagoRepository,
  entityName: "dividendo_pago",
  serviceName: "DividendoPagoService",
});
