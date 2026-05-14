const { PersonaEstudiante } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PersonaEstudiante,
  entity: "persona_estudiante",
  primaryKeys: ["id_persona"],
});
