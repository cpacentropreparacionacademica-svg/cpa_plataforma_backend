const CentroCostoRepository = require("../repository/centro_costo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: CentroCostoRepository,
  entityName: "centro_costo",
  serviceName: "CentroCostoService",
});
