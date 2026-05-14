const ConceptoCostoRepository = require("../repository/concepto_costo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ConceptoCostoRepository,
  entityName: "concepto_costo",
  serviceName: "ConceptoCostoService",
});
