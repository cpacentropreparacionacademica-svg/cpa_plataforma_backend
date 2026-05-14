const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const DividendoController = require("../controller/dividendo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "dividendo.router" });

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
} = require("../schemas/dividendo.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.DIVIDENDO.CREATE"),
  validateBody(createSchema, logger, "dividendo_creation"),
  DividendoController.create
);

router.put(
  "/:id_dividendo",
  requirePermission("SOCIETARIO.DIVIDENDO.UPDATE"),
  validateParams(idSchema, logger, "dividendo_update"),
  validateBody(updateSchema, logger, "dividendo_update"),
  DividendoController.update
);

router.get(
  "/:id_dividendo",
  requirePermission("SOCIETARIO.DIVIDENDO.READ"),
  validateParams(idSchema, logger, "dividendo_get"),
  DividendoController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.DIVIDENDO.READ"),
  validateQuery(querySchema, logger, "dividendo_list"),
  DividendoController.list
);

module.exports = router;
