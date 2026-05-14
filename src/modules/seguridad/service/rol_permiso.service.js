const RolPermisoRepository = require("../repository/rol_permiso.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: RolPermisoRepository,
  entityName: "rol_permiso",
  serviceName: "RolPermisoService",
});
