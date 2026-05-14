const { CentroCostoMapa } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: CentroCostoMapa,
  entity: "centro_costo_mapa",
  primaryKeys: ["id_cc_mapa"],
});
