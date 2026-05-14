const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const CuentaAsignacionController = require("../controller/cuenta_asignacion.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "cuenta_asignacion.router" });

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
} = require("../schemas/cuenta_asignacion.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.CUENTA_ASIGNACION.CREATE"),
  validateBody(createSchema, logger, "cuenta_asignacion_creation"),
  CuentaAsignacionController.create
);

router.put(
  "/:id_cuenta_asignacion",
  requirePermission("CONTABILIDAD.CUENTA_ASIGNACION.UPDATE"),
  validateParams(idSchema, logger, "cuenta_asignacion_update"),
  validateBody(updateSchema, logger, "cuenta_asignacion_update"),
  CuentaAsignacionController.update
);

router.get(
  "/:id_cuenta_asignacion",
  requirePermission("CONTABILIDAD.CUENTA_ASIGNACION.READ"),
  validateParams(idSchema, logger, "cuenta_asignacion_get"),
  CuentaAsignacionController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.CUENTA_ASIGNACION.READ"),
  validateQuery(querySchema, logger, "cuenta_asignacion_list"),
  CuentaAsignacionController.list
);

module.exports = router;
