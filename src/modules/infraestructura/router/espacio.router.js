const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EspacioController = require("../controller/espacio.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "espacio.router" });

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
} = require("../schemas/espacio.schema");

router.post(
  "/",
  requirePermission("INFRAESTRUCTURA.ESPACIO.CREATE"),
  validateBody(createSchema, logger, "espacio_creation"),
  EspacioController.create
);

router.put(
  "/:id_espacio",
  requirePermission("INFRAESTRUCTURA.ESPACIO.UPDATE"),
  validateParams(idSchema, logger, "espacio_update"),
  validateBody(updateSchema, logger, "espacio_update"),
  EspacioController.update
);

router.get(
  "/:id_espacio",
  requirePermission("INFRAESTRUCTURA.ESPACIO.READ"),
  validateParams(idSchema, logger, "espacio_get"),
  EspacioController.get
);

router.get(
  "/",
  requirePermission("INFRAESTRUCTURA.ESPACIO.READ"),
  validateQuery(querySchema, logger, "espacio_list"),
  EspacioController.list
);

module.exports = router;
