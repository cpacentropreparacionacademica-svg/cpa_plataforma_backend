const { BienInstancia } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: BienInstancia,
  entity: "bien_instancia",
  primaryKeys: ["id_bien_instancia"],
});
