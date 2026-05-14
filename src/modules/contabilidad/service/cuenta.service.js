const CuentaRepository = require("../repository/cuenta.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: CuentaRepository,
  entityName: "cuenta",
  serviceName: "CuentaService",
});
