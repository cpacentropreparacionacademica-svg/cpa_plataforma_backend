const { Cuenta } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Cuenta,
  entity: "cuenta",
  primaryKeys: ["id_cuenta"],
});
