const ClaseTituloRepository = require("../repository/clase_titulo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ClaseTituloRepository,
  entityName: "clase_titulo",
  serviceName: "ClaseTituloService",
});
