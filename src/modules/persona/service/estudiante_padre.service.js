const EstudiantePadreRepository = require("../repository/estudiante_padre.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: EstudiantePadreRepository,
  entityName: "estudiante_padre",
  serviceName: "EstudiantePadreService",
});
