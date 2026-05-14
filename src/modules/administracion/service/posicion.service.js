const PosicionRepository = require("../repository/posicion.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PosicionRepository,
  entityName: "posicion",
  serviceName: "PosicionService",
});
