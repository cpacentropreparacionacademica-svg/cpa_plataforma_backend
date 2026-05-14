const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PagoTutorDetalleController = require("../controller/pago_tutor_detalle.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "pago_tutor_detalle.router" });

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
} = require("../schemas/pago_tutor_detalle.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.PAGO_TUTOR_DETALLE.CREATE"),
  validateBody(createSchema, logger, "pago_tutor_detalle_creation"),
  PagoTutorDetalleController.create
);

router.put(
  "/:id_pago_tutor_detalle",
  requirePermission("CONTABILIDAD.PAGO_TUTOR_DETALLE.UPDATE"),
  validateParams(idSchema, logger, "pago_tutor_detalle_update"),
  validateBody(updateSchema, logger, "pago_tutor_detalle_update"),
  PagoTutorDetalleController.update
);

router.get(
  "/:id_pago_tutor_detalle",
  requirePermission("CONTABILIDAD.PAGO_TUTOR_DETALLE.READ"),
  validateParams(idSchema, logger, "pago_tutor_detalle_get"),
  PagoTutorDetalleController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.PAGO_TUTOR_DETALLE.READ"),
  validateQuery(querySchema, logger, "pago_tutor_detalle_list"),
  PagoTutorDetalleController.list
);

module.exports = router;
