const RolRepository = require("../repository/rol.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: RolRepository,
  entityName: "rol",
  serviceName: "RolService",
});
