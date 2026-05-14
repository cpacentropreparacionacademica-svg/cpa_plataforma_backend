const ClaseCursoRepository = require("../repository/clase_curso.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ClaseCursoRepository,
  entityName: "clase_curso",
  serviceName: "ClaseCursoService",
});
