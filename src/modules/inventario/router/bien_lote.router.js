const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const BienLoteController = require("../controller/bien_lote.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "bien_lote.router" });

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
} = require("../schemas/bien_lote.schema");

router.post(
  "/",
  requirePermission("INVENTARIO.BIEN_LOTE.CREATE"),
  validateBody(createSchema, logger, "bien_lote_creation"),
  BienLoteController.create
);

router.put(
  "/:id_lote",
  requirePermission("INVENTARIO.BIEN_LOTE.UPDATE"),
  validateParams(idSchema, logger, "bien_lote_update"),
  validateBody(updateSchema, logger, "bien_lote_update"),
  BienLoteController.update
);

router.get(
  "/:id_lote",
  requirePermission("INVENTARIO.BIEN_LOTE.READ"),
  validateParams(idSchema, logger, "bien_lote_get"),
  BienLoteController.get
);

router.get(
  "/",
  requirePermission("INVENTARIO.BIEN_LOTE.READ"),
  validateQuery(querySchema, logger, "bien_lote_list"),
  BienLoteController.list
);

module.exports = router;
