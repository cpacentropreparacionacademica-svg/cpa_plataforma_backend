const { UsuarioPermiso } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: UsuarioPermiso,
  entity: "usuario_permiso",
  primaryKeys: ["id_persona", "id_permiso"],
});
