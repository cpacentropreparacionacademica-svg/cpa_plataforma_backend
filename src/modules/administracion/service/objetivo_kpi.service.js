const ObjetivoKpiRepository = require("../repository/objetivo_kpi.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: ObjetivoKpiRepository,
  entityName: "objetivo_kpi",
  serviceName: "ObjetivoKpiService",
});
