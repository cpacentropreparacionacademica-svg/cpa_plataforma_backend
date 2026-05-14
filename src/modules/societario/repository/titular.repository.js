const { Titular } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Titular,
  entity: "titular",
  primaryKeys: ["id_titular"],
});
