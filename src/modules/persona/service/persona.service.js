const PersonaRepository = require("../repository/persona.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: PersonaRepository,
  entityName: "persona",
  serviceName: "PersonaService",
});
