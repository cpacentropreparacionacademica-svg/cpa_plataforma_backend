const EspacioRepository = require("../repository/espacio.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EspacioRepository,
  entityName: "espacio",
  serviceName: "EspacioService",
});
