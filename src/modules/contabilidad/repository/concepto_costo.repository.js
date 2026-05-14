const { ConceptoCosto } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ConceptoCosto,
  entity: "concepto_costo",
  primaryKeys: ["id_concepto"],
});
