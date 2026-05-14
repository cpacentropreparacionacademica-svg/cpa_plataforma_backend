const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EmisionTituloController = require("../controller/emision_titulo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "emision_titulo.router" });

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
} = require("../schemas/emision_titulo.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.EMISION_TITULO.CREATE"),
  validateBody(createSchema, logger, "emision_titulo_creation"),
  EmisionTituloController.create
);

router.put(
  "/:id_emision",
  requirePermission("SOCIETARIO.EMISION_TITULO.UPDATE"),
  validateParams(idSchema, logger, "emision_titulo_update"),
  validateBody(updateSchema, logger, "emision_titulo_update"),
  EmisionTituloController.update
);

router.get(
  "/:id_emision",
  requirePermission("SOCIETARIO.EMISION_TITULO.READ"),
  validateParams(idSchema, logger, "emision_titulo_get"),
  EmisionTituloController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.EMISION_TITULO.READ"),
  validateQuery(querySchema, logger, "emision_titulo_list"),
  EmisionTituloController.list
);

module.exports = router;
