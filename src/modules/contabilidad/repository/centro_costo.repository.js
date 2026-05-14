const { CentroCosto } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: CentroCosto,
  entity: "centro_costo",
  primaryKeys: ["id_centro_costo"],
});
