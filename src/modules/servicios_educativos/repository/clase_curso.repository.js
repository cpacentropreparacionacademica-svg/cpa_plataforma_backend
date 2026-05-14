const { ClaseCurso } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ClaseCurso,
  entity: "clase_curso",
  primaryKeys: ["id_clase_curso"],
});
