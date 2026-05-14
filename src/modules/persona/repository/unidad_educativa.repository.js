const { UnidadEducativa } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: UnidadEducativa,
  entity: "unidad_educativa",
  primaryKeys: ["id_unidad_educativa"],
});
