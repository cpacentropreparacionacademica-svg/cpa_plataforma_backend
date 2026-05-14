const { ObjetivoKpi } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ObjetivoKpi,
  entity: "objetivo_kpi",
  primaryKeys: ["id_objetivo_kpi"],
});
