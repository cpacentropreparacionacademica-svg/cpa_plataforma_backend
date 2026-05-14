const { Sesion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Sesion,
  entity: "sesion",
  primaryKeys: ["id_sesion"],
});
