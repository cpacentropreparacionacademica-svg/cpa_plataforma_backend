const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PagoTutorController = require("../controller/pago_tutor.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "pago_tutor.router" });

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
} = require("../schemas/pago_tutor.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.PAGO_TUTOR.CREATE"),
  validateBody(createSchema, logger, "pago_tutor_creation"),
  PagoTutorController.create
);

router.put(
  "/:id_pago_tutor",
  requirePermission("CONTABILIDAD.PAGO_TUTOR.UPDATE"),
  validateParams(idSchema, logger, "pago_tutor_update"),
  validateBody(updateSchema, logger, "pago_tutor_update"),
  PagoTutorController.update
);

router.get(
  "/:id_pago_tutor",
  requirePermission("CONTABILIDAD.PAGO_TUTOR.READ"),
  validateParams(idSchema, logger, "pago_tutor_get"),
  PagoTutorController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.PAGO_TUTOR.READ"),
  validateQuery(querySchema, logger, "pago_tutor_list"),
  PagoTutorController.list
);

module.exports = router;
