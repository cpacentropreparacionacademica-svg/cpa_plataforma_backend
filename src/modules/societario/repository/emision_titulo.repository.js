const { EmisionTitulo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: EmisionTitulo,
  entity: "emision_titulo",
  primaryKeys: ["id_emision"],
});
