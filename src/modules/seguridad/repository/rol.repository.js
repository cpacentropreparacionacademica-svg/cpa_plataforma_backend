const { Rol } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: Rol,
  entity: "rol",
  primaryKeys: ["id_rol"],
});
