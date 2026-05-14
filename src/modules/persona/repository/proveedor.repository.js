const { Proveedor } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Proveedor,
  entity: "proveedor",
  primaryKeys: ["id_proveedor"],
});
