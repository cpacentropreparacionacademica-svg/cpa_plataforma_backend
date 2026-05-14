const { Sucursal } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Sucursal,
  entity: "sucursal",
  primaryKeys: ["id_sucursal"],
});
