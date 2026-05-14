const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PagoController = require("../controller/pago.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "pago.router" });

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
} = require("../schemas/pago.schema");

router.post(
  "/",
  requirePermission("DEUDA.PAGO.CREATE"),
  validateBody(createSchema, logger, "pago_creation"),
  PagoController.create
);

router.put(
  "/:id_pago",
  requirePermission("DEUDA.PAGO.UPDATE"),
  validateParams(idSchema, logger, "pago_update"),
  validateBody(updateSchema, logger, "pago_update"),
  PagoController.update
);

router.get(
  "/:id_pago",
  requirePermission("DEUDA.PAGO.READ"),
  validateParams(idSchema, logger, "pago_get"),
  PagoController.get
);

router.get(
  "/",
  requirePermission("DEUDA.PAGO.READ"),
  validateQuery(querySchema, logger, "pago_list"),
  PagoController.list
);

module.exports = router;
