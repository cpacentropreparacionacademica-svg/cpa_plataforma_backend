const { Transaccion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Transaccion,
  entity: "transaccion",
  primaryKeys: ["id_transaccion"],
});
