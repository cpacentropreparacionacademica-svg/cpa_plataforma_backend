const { PersonaUsuario } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PersonaUsuario,
  entity: "persona_usuario",
  primaryKeys: ["id_persona"],
});
