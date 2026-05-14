const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TransaccionController = require("../controller/transaccion.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "transaccion.router" });

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
} = require("../schemas/transaccion.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.TRANSACCION.CREATE"),
  validateBody(createSchema, logger, "transaccion_creation"),
  TransaccionController.create
);

router.put(
  "/:id_transaccion",
  requirePermission("CONTABILIDAD.TRANSACCION.UPDATE"),
  validateParams(idSchema, logger, "transaccion_update"),
  validateBody(updateSchema, logger, "transaccion_update"),
  TransaccionController.update
);

router.get(
  "/:id_transaccion",
  requirePermission("CONTABILIDAD.TRANSACCION.READ"),
  validateParams(idSchema, logger, "transaccion_get"),
  TransaccionController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.TRANSACCION.READ"),
  validateQuery(querySchema, logger, "transaccion_list"),
  TransaccionController.list
);

module.exports = router;
