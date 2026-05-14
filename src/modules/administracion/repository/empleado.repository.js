const { Empleado } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Empleado,
  entity: "empleado",
  primaryKeys: ["id_empleado"],
});
