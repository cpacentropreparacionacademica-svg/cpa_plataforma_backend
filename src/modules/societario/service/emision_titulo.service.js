const EmisionTituloRepository = require("../repository/emision_titulo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EmisionTituloRepository,
  entityName: "emision_titulo",
  serviceName: "EmisionTituloService",
});
