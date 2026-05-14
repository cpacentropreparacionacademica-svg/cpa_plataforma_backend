const { ClasePorHora } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ClasePorHora,
  entity: "clase_por_hora",
  primaryKeys: ["id_clase"],
});
