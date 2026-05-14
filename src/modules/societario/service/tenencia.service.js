const TenenciaRepository = require("../repository/tenencia.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: TenenciaRepository,
  entityName: "tenencia",
  serviceName: "TenenciaService",
});
