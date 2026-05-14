const GrupoCuentaRepository = require("../repository/grupo_cuenta.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: GrupoCuentaRepository,
  entityName: "grupo_cuenta",
  serviceName: "GrupoCuentaService",
});
