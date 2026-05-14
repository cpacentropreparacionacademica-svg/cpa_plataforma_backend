const { Espacio } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Espacio,
  entity: "espacio",
  primaryKeys: ["id_espacio"],
});
