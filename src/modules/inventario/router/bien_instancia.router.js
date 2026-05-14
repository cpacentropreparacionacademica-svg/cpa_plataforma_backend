const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const BienInstanciaController = require("../controller/bien_instancia.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "bien_instancia.router" });

const {
  validateBody,
  validateParams,
  validateQuery,
} = require("../../../../middlewares/validate.middleware");

const {
  createSchema,
  updateSchema,
  idSchema,
  querySchema,
} = require("../schemas/bien_instancia.schema");

router.post(
  "/",
  requirePermission("INVENTARIO.BIEN_INSTANCIA.CREATE"),
  validateBody(createSchema, logger, "bien_instancia_creation"),
  BienInstanciaController.create
);

router.put(
  "/:id_bien_instancia",
  requirePermission("INVENTARIO.BIEN_INSTANCIA.UPDATE"),
  validateParams(idSchema, logger, "bien_instancia_update"),
  validateBody(updateSchema, logger, "bien_instancia_update"),
  BienInstanciaController.update
);

router.get(
  "/:id_bien_instancia",
  requirePermission("INVENTARIO.BIEN_INSTANCIA.READ"),
  validateParams(idSchema, logger, "bien_instancia_get"),
  BienInstanciaController.get
);

router.get(
  "/",
  requirePermission("INVENTARIO.BIEN_INSTANCIA.READ"),
  validateQuery(querySchema, logger, "bien_instancia_list"),
  BienInstanciaController.list
);

module.exports = router;
