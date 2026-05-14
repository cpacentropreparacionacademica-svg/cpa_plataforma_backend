const { Persona } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Persona,
  entity: "persona",
  primaryKeys: ["id_persona"],
});
