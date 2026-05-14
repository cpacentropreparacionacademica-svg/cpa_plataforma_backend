const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TransaccionMovimientoCuentaController = require("../controller/transaccion_movimiento_cuenta.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "transaccion_movimiento_cuenta.router" });

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
} = require("../schemas/transaccion_movimiento_cuenta.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.CREATE"),
  validateBody(createSchema, logger, "transaccion_movimiento_cuenta_creation"),
  TransaccionMovimientoCuentaController.create
);

router.put(
  "/:id_movimiento",
  requirePermission("CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.UPDATE"),
  validateParams(idSchema, logger, "transaccion_movimiento_cuenta_update"),
  validateBody(updateSchema, logger, "transaccion_movimiento_cuenta_update"),
  TransaccionMovimientoCuentaController.update
);

router.get(
  "/:id_movimiento",
  requirePermission("CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ"),
  validateParams(idSchema, logger, "transaccion_movimiento_cuenta_get"),
  TransaccionMovimientoCuentaController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.TRANSACCION_MOVIMIENTO_CUENTA.READ"),
  validateQuery(querySchema, logger, "transaccion_movimiento_cuenta_list"),
  TransaccionMovimientoCuentaController.list
);

module.exports = router;
