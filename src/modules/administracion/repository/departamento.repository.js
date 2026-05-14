const { Departamento } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Departamento,
  entity: "departamento",
  primaryKeys: ["id_departamento"],
});
