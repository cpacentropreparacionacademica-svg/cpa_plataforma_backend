const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ClaseTituloController = require("../controller/clase_titulo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "clase_titulo.router" });

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
} = require("../schemas/clase_titulo.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.CLASE_TITULO.CREATE"),
  validateBody(createSchema, logger, "clase_titulo_creation"),
  ClaseTituloController.create
);

router.put(
  "/:id_clase_titulo",
  requirePermission("SOCIETARIO.CLASE_TITULO.UPDATE"),
  validateParams(idSchema, logger, "clase_titulo_update"),
  validateBody(updateSchema, logger, "clase_titulo_update"),
  ClaseTituloController.update
);

router.get(
  "/:id_clase_titulo",
  requirePermission("SOCIETARIO.CLASE_TITULO.READ"),
  validateParams(idSchema, logger, "clase_titulo_get"),
  ClaseTituloController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.CLASE_TITULO.READ"),
  validateQuery(querySchema, logger, "clase_titulo_list"),
  ClaseTituloController.list
);

module.exports = router;
