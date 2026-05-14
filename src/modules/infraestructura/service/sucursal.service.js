const SucursalRepository = require("../repository/sucursal.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: SucursalRepository,
  entityName: "sucursal",
  serviceName: "SucursalService",
});
