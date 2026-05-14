const { Posicion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Posicion,
  entity: "posicion",
  primaryKeys: ["id_posicion"],
});
