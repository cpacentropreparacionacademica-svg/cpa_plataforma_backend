const ClasePorHoraRepository = require("../repository/clase_por_hora.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ClasePorHoraRepository,
  entityName: "clase_por_hora",
  serviceName: "ClasePorHoraService",
});
