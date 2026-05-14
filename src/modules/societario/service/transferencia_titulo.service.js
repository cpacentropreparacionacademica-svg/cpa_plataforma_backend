const TransferenciaTituloRepository = require("../repository/transferencia_titulo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: TransferenciaTituloRepository,
  entityName: "transferencia_titulo",
  serviceName: "TransferenciaTituloService",
});
