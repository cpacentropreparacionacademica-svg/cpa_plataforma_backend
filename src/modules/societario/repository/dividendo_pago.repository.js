const { DividendoPago } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: DividendoPago,
  entity: "dividendo_pago",
  primaryKeys: ["id_dividendo_pago"],
});
