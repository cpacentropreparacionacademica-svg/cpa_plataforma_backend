const CuentaAsignacionRepository = require("../repository/cuenta_asignacion.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: CuentaAsignacionRepository,
  entityName: "cuenta_asignacion",
  serviceName: "CuentaAsignacionService",
});
