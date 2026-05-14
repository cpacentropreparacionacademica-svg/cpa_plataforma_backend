const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const CuentaController = require("../controller/cuenta.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "cuenta.router" });

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
} = require("../schemas/cuenta.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.CUENTA.CREATE"),
  validateBody(createSchema, logger, "cuenta_creation"),
  CuentaController.create
);

router.put(
  "/:id_cuenta",
  requirePermission("CONTABILIDAD.CUENTA.UPDATE"),
  validateParams(idSchema, logger, "cuenta_update"),
  validateBody(updateSchema, logger, "cuenta_update"),
  CuentaController.update
);

router.get(
  "/:id_cuenta",
  requirePermission("CONTABILIDAD.CUENTA.READ"),
  validateParams(idSchema, logger, "cuenta_get"),
  CuentaController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.CUENTA.READ"),
  validateQuery(querySchema, logger, "cuenta_list"),
  CuentaController.list
);

module.exports = router;
