const { EmpleadoRegistroPago } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: EmpleadoRegistroPago,
  entity: "empleado_registro_pago",
  primaryKeys: ["id_pago"],
});
