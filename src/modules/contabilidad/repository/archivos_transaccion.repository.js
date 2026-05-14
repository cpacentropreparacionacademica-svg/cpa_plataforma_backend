const { ArchivosTransaccion } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ArchivosTransaccion,
  entity: "archivos_transaccion",
  primaryKeys: ["id_archivo"],
});
