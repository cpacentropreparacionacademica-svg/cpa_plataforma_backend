const UsuarioRolRepository = require("../repository/usuario_rol.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: UsuarioRolRepository,
  entityName: "usuario_rol",
  serviceName: "UsuarioRolService",
});
