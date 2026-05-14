const { Permiso } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Permiso,
  entity: "permiso",
  primaryKeys: ["id_permiso"],
});
