const BienLoteRepository = require("../repository/bien_lote.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: BienLoteRepository,
  entityName: "bien_lote",
  serviceName: "BienLoteService",
});
