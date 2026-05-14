const PaquetesProductoEducativoRepository = require("../repository/paquetes_producto_educativo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PaquetesProductoEducativoRepository,
  entityName: "paquetes_producto_educativo",
  serviceName: "PaquetesProductoEducativoService",
});
