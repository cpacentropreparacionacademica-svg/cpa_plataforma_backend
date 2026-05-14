const { Dividendo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Dividendo,
  entity: "dividendo",
  primaryKeys: ["id_dividendo"],
});
