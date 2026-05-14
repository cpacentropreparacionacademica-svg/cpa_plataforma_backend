const { UsuarioRol } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: UsuarioRol,
  entity: "usuario_rol",
  primaryKeys: ["id_persona", "id_rol"],
});
