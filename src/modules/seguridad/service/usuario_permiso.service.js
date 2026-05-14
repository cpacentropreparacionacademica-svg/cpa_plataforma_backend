const UsuarioPermisoRepository = require("../repository/usuario_permiso.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: UsuarioPermisoRepository,
  entityName: "usuario_permiso",
  serviceName: "UsuarioPermisoService",
});
