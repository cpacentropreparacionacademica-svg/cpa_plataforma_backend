const ProveedorRepository = require("../repository/proveedor.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ProveedorRepository,
  entityName: "proveedor",
  serviceName: "ProveedorService",
});
