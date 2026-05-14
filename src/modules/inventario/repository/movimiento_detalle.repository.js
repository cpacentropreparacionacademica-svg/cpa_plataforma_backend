const { MovimientoDetalle } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: MovimientoDetalle,
  entity: "movimiento_detalle",
  primaryKeys: ["id_movimiento"],
});
