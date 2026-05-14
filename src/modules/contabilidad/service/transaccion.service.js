const TransaccionRepository = require("../repository/transaccion.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: TransaccionRepository,
  entityName: "transaccion",
  serviceName: "TransaccionService",
});
