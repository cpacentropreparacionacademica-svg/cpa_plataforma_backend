const { RolPermiso } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: RolPermiso,
  entity: "rol_permiso",
  primaryKeys: ["id_rol", "id_permiso"],
});
