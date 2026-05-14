const { Edificio } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Edificio,
  entity: "edificio",
  primaryKeys: ["id_edificio"],
});
