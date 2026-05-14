const { MateriaTree } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: MateriaTree,
  entity: "materia_tree",
  primaryKeys: ["id_tree"],
});
