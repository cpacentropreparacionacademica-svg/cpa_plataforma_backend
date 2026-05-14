const SesionRepository = require("../repository/sesion.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: SesionRepository,
  entityName: "sesion",
  serviceName: "SesionService",
});
