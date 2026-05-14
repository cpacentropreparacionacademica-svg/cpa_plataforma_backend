const EdificioRepository = require("../repository/edificio.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EdificioRepository,
  entityName: "edificio",
  serviceName: "EdificioService",
});
