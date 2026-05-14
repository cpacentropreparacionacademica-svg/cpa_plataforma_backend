const { EstudiantePadre } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: EstudiantePadre,
  entity: "estudiante_padre",
  primaryKeys: ["id_asociacion"],
});
