const { GrupoCuenta } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: GrupoCuenta,
  entity: "grupo_cuenta",
  primaryKeys: ["id_grupo_cuenta"],
});
