const { ClaseTitulo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ClaseTitulo,
  entity: "clase_titulo",
  primaryKeys: ["id_clase_titulo"],
});
