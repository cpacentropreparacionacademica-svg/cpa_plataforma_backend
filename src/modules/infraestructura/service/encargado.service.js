const EncargadoRepository = require("../repository/encargado.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EncargadoRepository,
  entityName: "encargado",
  serviceName: "EncargadoService",
});
