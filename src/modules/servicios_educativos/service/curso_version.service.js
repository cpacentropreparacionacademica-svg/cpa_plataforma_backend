const CursoVersionRepository = require("../repository/curso_version.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: CursoVersionRepository,
  entityName: "curso_version",
  serviceName: "CursoVersionService",
});
