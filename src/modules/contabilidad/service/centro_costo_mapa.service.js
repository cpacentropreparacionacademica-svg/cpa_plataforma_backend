const CentroCostoMapaRepository = require("../repository/centro_costo_mapa.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: CentroCostoMapaRepository,
  entityName: "centro_costo_mapa",
  serviceName: "CentroCostoMapaService",
});
