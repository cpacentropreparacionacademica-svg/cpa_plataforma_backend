const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ProveedorController = require("../controller/proveedor.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "proveedor.router" });

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
} = require("../schemas/proveedor.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PROVEEDOR.CREATE"),
  validateBody(createSchema, logger, "proveedor_creation"),
  ProveedorController.create
);

router.put(
  "/:id_proveedor",
  requirePermission("PERSONAS.PROVEEDOR.UPDATE"),
  validateParams(idSchema, logger, "proveedor_update"),
  validateBody(updateSchema, logger, "proveedor_update"),
  ProveedorController.update
);

router.get(
  "/:id_proveedor",
  requirePermission("PERSONAS.PROVEEDOR.READ"),
  validateParams(idSchema, logger, "proveedor_get"),
  ProveedorController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PROVEEDOR.READ"),
  validateQuery(querySchema, logger, "proveedor_list"),
  ProveedorController.list
);

module.exports = router;
