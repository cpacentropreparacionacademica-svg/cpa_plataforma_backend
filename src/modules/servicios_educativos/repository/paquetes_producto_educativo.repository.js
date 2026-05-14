const { PaquetesProductoEducativo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: PaquetesProductoEducativo,
  entity: "paquetes_producto_educativo",
  primaryKeys: ["id_paquete"],
});
