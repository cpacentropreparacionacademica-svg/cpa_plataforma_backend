const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EmpleadoRegistroPagoController = require("../controller/empleado_registro_pago.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "empleado_registro_pago.router" });

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
} = require("../schemas/empleado_registro_pago.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.CREATE"),
  validateBody(createSchema, logger, "empleado_registro_pago_creation"),
  EmpleadoRegistroPagoController.create
);

router.put(
  "/:id_pago",
  requirePermission("ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.UPDATE"),
  validateParams(idSchema, logger, "empleado_registro_pago_update"),
  validateBody(updateSchema, logger, "empleado_registro_pago_update"),
  EmpleadoRegistroPagoController.update
);

router.get(
  "/:id_pago",
  requirePermission("ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ"),
  validateParams(idSchema, logger, "empleado_registro_pago_get"),
  EmpleadoRegistroPagoController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.EMPLEADO_REGISTRO_PAGO.READ"),
  validateQuery(querySchema, logger, "empleado_registro_pago_list"),
  EmpleadoRegistroPagoController.list
);

module.exports = router;
