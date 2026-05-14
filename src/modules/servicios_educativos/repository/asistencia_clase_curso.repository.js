const { AsistenciaClaseCurso } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: AsistenciaClaseCurso,
  entity: "asistencia_clase_curso",
  primaryKeys: ["id_asistencia"],
});
