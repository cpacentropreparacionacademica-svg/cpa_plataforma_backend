const DepartamentoRepository = require("../repository/departamento.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: DepartamentoRepository,
  entityName: "departamento",
  serviceName: "DepartamentoService",
});
