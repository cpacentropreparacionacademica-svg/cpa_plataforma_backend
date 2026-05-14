const DividendoRepository = require("../repository/dividendo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: DividendoRepository,
  entityName: "dividendo",
  serviceName: "DividendoService",
});
