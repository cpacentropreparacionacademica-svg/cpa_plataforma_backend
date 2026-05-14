const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TitularController = require("../controller/titular.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "titular.router" });

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
} = require("../schemas/titular.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.TITULAR.CREATE"),
  validateBody(createSchema, logger, "titular_creation"),
  TitularController.create
);

router.put(
  "/:id_titular",
  requirePermission("SOCIETARIO.TITULAR.UPDATE"),
  validateParams(idSchema, logger, "titular_update"),
  validateBody(updateSchema, logger, "titular_update"),
  TitularController.update
);

router.get(
  "/:id_titular",
  requirePermission("SOCIETARIO.TITULAR.READ"),
  validateParams(idSchema, logger, "titular_get"),
  TitularController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.TITULAR.READ"),
  validateQuery(querySchema, logger, "titular_list"),
  TitularController.list
);

module.exports = router;
