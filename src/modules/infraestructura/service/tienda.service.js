const TiendaRepository = require("../repository/tienda.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: TiendaRepository,
  entityName: "tienda",
  serviceName: "TiendaService",
});
