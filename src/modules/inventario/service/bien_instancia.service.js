const BienInstanciaRepository = require("../repository/bien_instancia.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: BienInstanciaRepository,
  entityName: "bien_instancia",
  serviceName: "BienInstanciaService",
});
