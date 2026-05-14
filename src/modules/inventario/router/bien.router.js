const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const BienController = require("../controller/bien.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "bien.router" });

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
} = require("../schemas/bien.schema");

router.post(
  "/",
  requirePermission("INVENTARIO.BIEN.CREATE"),
  validateBody(createSchema, logger, "bien_creation"),
  BienController.create
);

router.put(
  "/:id_bien",
  requirePermission("INVENTARIO.BIEN.UPDATE"),
  validateParams(idSchema, logger, "bien_update"),
  validateBody(updateSchema, logger, "bien_update"),
  BienController.update
);

router.get(
  "/:id_bien",
  requirePermission("INVENTARIO.BIEN.READ"),
  validateParams(idSchema, logger, "bien_get"),
  BienController.get
);

router.get(
  "/",
  requirePermission("INVENTARIO.BIEN.READ"),
  validateQuery(querySchema, logger, "bien_list"),
  BienController.list
);

module.exports = router;
