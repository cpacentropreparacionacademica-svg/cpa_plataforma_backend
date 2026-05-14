const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const DividendoPagoController = require("../controller/dividendo_pago.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "dividendo_pago.router" });

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
} = require("../schemas/dividendo_pago.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.DIVIDENDO_PAGO.CREATE"),
  validateBody(createSchema, logger, "dividendo_pago_creation"),
  DividendoPagoController.create
);

router.put(
  "/:id_dividendo_pago",
  requirePermission("SOCIETARIO.DIVIDENDO_PAGO.UPDATE"),
  validateParams(idSchema, logger, "dividendo_pago_update"),
  validateBody(updateSchema, logger, "dividendo_pago_update"),
  DividendoPagoController.update
);

router.get(
  "/:id_dividendo_pago",
  requirePermission("SOCIETARIO.DIVIDENDO_PAGO.READ"),
  validateParams(idSchema, logger, "dividendo_pago_get"),
  DividendoPagoController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.DIVIDENDO_PAGO.READ"),
  validateQuery(querySchema, logger, "dividendo_pago_list"),
  DividendoPagoController.list
);

module.exports = router;
