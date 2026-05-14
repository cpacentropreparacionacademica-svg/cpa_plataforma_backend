const { ProductoEducativo } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ProductoEducativo,
  entity: "producto_educativo",
  primaryKeys: ["id_producto_educativo"],
});
