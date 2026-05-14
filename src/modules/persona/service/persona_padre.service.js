const PersonaPadreRepository = require("../repository/persona_padre.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PersonaPadreRepository,
  entityName: "persona_padre",
  serviceName: "PersonaPadreService",
});
