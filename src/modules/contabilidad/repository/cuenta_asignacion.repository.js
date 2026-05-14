const { CuentaAsignacion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: CuentaAsignacion,
  entity: "cuenta_asignacion",
  primaryKeys: ["id_cuenta_asignacion"],
});
