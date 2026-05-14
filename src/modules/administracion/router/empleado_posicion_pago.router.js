const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EmpleadoPosicionPagoController = require("../controller/empleado_posicion_pago.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "empleado_posicion_pago.router" });

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
} = require("../schemas/empleado_posicion_pago.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO_POSICION_PAGO.CREATE"),
  validateBody(createSchema, logger, "empleado_posicion_pago_creation"),
  EmpleadoPosicionPagoController.create
);

router.put(
  "/:id_empleado_posicion",
  requirePermission("ADMINISTRACION.EMPLEADO_POSICION_PAGO.UPDATE"),
  validateParams(idSchema, logger, "empleado_posicion_pago_update"),
  validateBody(updateSchema, logger, "empleado_posicion_pago_update"),
  EmpleadoPosicionPagoController.update
);

router.get(
  "/:id_empleado_posicion",
  requirePermission("ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ"),
  validateParams(idSchema, logger, "empleado_posicion_pago_get"),
  EmpleadoPosicionPagoController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO_POSICION_PAGO.READ"),
  validateQuery(querySchema, logger, "empleado_posicion_pago_list"),
  EmpleadoPosicionPagoController.list
);

module.exports = router;
