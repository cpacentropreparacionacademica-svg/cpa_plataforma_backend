const KpiRepository = require("../repository/kpi.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: KpiRepository,
  entityName: "kpi",
  serviceName: "KpiService",
});
