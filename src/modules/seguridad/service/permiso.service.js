const PermisoRepository = require("../repository/permiso.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PermisoRepository,
  entityName: "permiso",
  serviceName: "PermisoService",
});
