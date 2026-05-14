const { TransferenciaTitulo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: TransferenciaTitulo,
  entity: "transferencia_titulo",
  primaryKeys: ["id_transferencia"],
});
