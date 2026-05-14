const { Bien } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Bien,
  entity: "bien",
  primaryKeys: ["id_bien"],
});
