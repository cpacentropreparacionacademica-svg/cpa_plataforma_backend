const UnidadEducativaRepository = require("../repository/unidad_educativa.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: UnidadEducativaRepository,
  entityName: "unidad_educativa",
  serviceName: "UnidadEducativaService",
});
