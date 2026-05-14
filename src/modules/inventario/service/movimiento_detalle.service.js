const MovimientoDetalleRepository = require("../repository/movimiento_detalle.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: MovimientoDetalleRepository,
  entityName: "movimiento_detalle",
  serviceName: "MovimientoDetalleService",
});
