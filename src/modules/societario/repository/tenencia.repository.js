const { Tenencia } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Tenencia,
  entity: "tenencia",
  primaryKeys: ["id_tenencia"],
});
