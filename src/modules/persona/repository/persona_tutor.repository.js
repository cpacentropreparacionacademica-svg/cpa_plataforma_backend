const { PersonaTutor } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PersonaTutor,
  entity: "persona_tutor",
  primaryKeys: ["id_tutor"],
});
