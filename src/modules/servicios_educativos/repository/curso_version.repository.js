const { CursoVersion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: CursoVersion,
  entity: "curso_version",
  primaryKeys: ["id_curso_version"],
});
