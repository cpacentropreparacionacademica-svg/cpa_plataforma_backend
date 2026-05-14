const ProductoEducativoRepository = require("../repository/producto_educativo.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ProductoEducativoRepository,
  entityName: "producto_educativo",
  serviceName: "ProductoEducativoService",
});
