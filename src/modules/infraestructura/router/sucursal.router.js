const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const SucursalController = require("../controller/sucursal.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "sucursal.router" });

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
} = require("../schemas/sucursal.schema");

router.post(
  "/",
  requirePermission("INFRAESTRUCTURA.SUCURSAL.CREATE"),
  validateBody(createSchema, logger, "sucursal_creation"),
  SucursalController.create
);

router.put(
  "/:id_sucursal",
  requirePermission("INFRAESTRUCTURA.SUCURSAL.UPDATE"),
  validateParams(idSchema, logger, "sucursal_update"),
  validateBody(updateSchema, logger, "sucursal_update"),
  SucursalController.update
);

router.get(
  "/:id_sucursal",
  requirePermission("INFRAESTRUCTURA.SUCURSAL.READ"),
  validateParams(idSchema, logger, "sucursal_get"),
  SucursalController.get
);

router.get(
  "/",
  requirePermission("INFRAESTRUCTURA.SUCURSAL.READ"),
  validateQuery(querySchema, logger, "sucursal_list"),
  SucursalController.list
);

module.exports = router;
