const { Kpi } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Kpi,
  entity: "kpi",
  primaryKeys: ["id_kpi"],
});
