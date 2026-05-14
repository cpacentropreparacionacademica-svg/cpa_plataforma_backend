const ArchivosTransaccionRepository = require("../repository/archivos_transaccion.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ArchivosTransaccionRepository,
  entityName: "archivos_transaccion",
  serviceName: "ArchivosTransaccionService",
});
