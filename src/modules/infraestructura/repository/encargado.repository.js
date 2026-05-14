const { Encargado } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Encargado,
  entity: "encargado",
  primaryKeys: ["id_asignacion"],
});
