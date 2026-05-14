const BienRepository = require("../repository/bien.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: BienRepository,
  entityName: "bien",
  serviceName: "BienService",
});
