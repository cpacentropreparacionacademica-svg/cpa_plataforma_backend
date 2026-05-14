const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EncargadoController = require("../controller/encargado.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "encargado.router" });

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
} = require("../schemas/encargado.schema");

router.post(
  "/",
  requirePermission("INFRAESTRUCTURA.ENCARGADO.CREATE"),
  validateBody(createSchema, logger, "encargado_creation"),
  EncargadoController.create
);

router.put(
  "/:id_asignacion",
  requirePermission("INFRAESTRUCTURA.ENCARGADO.UPDATE"),
  validateParams(idSchema, logger, "encargado_update"),
  validateBody(updateSchema, logger, "encargado_update"),
  EncargadoController.update
);

router.get(
  "/:id_asignacion",
  requirePermission("INFRAESTRUCTURA.ENCARGADO.READ"),
  validateParams(idSchema, logger, "encargado_get"),
  EncargadoController.get
);

router.get(
  "/",
  requirePermission("INFRAESTRUCTURA.ENCARGADO.READ"),
  validateQuery(querySchema, logger, "encargado_list"),
  EncargadoController.list
);

module.exports = router;
