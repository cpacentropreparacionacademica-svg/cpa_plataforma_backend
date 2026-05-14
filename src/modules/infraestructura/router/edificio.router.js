const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EdificioController = require("../controller/edificio.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "edificio.router" });

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
} = require("../schemas/edificio.schema");

router.post(
  "/",
  requirePermission("INFRAESTRUCTURA.EDIFICIO.CREATE"),
  validateBody(createSchema, logger, "edificio_creation"),
  EdificioController.create
);

router.put(
  "/:id_edificio",
  requirePermission("INFRAESTRUCTURA.EDIFICIO.UPDATE"),
  validateParams(idSchema, logger, "edificio_update"),
  validateBody(updateSchema, logger, "edificio_update"),
  EdificioController.update
);

router.get(
  "/:id_edificio",
  requirePermission("INFRAESTRUCTURA.EDIFICIO.READ"),
  validateParams(idSchema, logger, "edificio_get"),
  EdificioController.get
);

router.get(
  "/",
  requirePermission("INFRAESTRUCTURA.EDIFICIO.READ"),
  validateQuery(querySchema, logger, "edificio_list"),
  EdificioController.list
);

module.exports = router;
