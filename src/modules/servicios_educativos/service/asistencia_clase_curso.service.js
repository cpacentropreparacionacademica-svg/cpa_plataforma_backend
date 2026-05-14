const AsistenciaClaseCursoRepository = require("../repository/asistencia_clase_curso.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: AsistenciaClaseCursoRepository,
  entityName: "asistencia_clase_curso",
  serviceName: "AsistenciaClaseCursoService",
});
