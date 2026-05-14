const HorariosRepository = require("../repository/horarios.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: HorariosRepository,
  entityName: "horarios",
  serviceName: "HorariosService",
});
