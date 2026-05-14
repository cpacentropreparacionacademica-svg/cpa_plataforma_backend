const { Pago } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Pago,
  entity: "pago",
  primaryKeys: ["id_pago"],
});
