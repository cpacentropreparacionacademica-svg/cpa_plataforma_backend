const DeudaRepository = require("../repository/deuda.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: DeudaRepository,
  entityName: "deuda",
  serviceName: "DeudaService",
});
