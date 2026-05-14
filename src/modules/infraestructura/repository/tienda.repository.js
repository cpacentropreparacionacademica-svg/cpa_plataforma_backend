const { Tienda } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Tienda,
  entity: "tienda",
  primaryKeys: ["id_tienda"],
});
