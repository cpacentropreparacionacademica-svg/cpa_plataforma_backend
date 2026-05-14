const { PersonaPadre } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PersonaPadre,
  entity: "persona_padre",
  primaryKeys: ["id_padre"],
});
