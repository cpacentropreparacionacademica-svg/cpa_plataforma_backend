const { BienLote } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: BienLote,
  entity: "bien_lote",
  primaryKeys: ["id_lote"],
});
