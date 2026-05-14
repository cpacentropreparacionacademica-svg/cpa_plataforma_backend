const { PagoTutorDetalle } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PagoTutorDetalle,
  entity: "pago_tutor_detalle",
  primaryKeys: ["id_pago_tutor_detalle"],
});
