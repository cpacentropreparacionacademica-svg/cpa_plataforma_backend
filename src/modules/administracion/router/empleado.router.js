const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EmpleadoController = require("../controller/empleado.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "empleado.router" });

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
} = require("../schemas/empleado.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO.CREATE"),
  validateBody(createSchema, logger, "empleado_creation"),
  EmpleadoController.create
);

router.put(
  "/:id_empleado",
  requirePermission("ADMINISTRACION.EMPLEADO.UPDATE"),
  validateParams(idSchema, logger, "empleado_update"),
  validateBody(updateSchema, logger, "empleado_update"),
  EmpleadoController.update
);

router.get(
  "/:id_empleado",
  requirePermission("ADMINISTRACION.EMPLEADO.READ"),
  validateParams(idSchema, logger, "empleado_get"),
  EmpleadoController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO.READ"),
  validateQuery(querySchema, logger, "empleado_list"),
  EmpleadoController.list
);

module.exports = router;
