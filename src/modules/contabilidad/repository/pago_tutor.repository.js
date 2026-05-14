const { PagoTutor } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PagoTutor,
  entity: "pago_tutor",
  primaryKeys: ["id_pago_tutor"],
});
