const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const DeudaController = require("../controller/deuda.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "deuda.router" });

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
} = require("../schemas/deuda.schema");

router.post(
  "/",
  requirePermission("DEUDA.DEUDA.CREATE"),
  validateBody(createSchema, logger, "deuda_creation"),
  DeudaController.create
);

router.put(
  "/:id_deuda",
  requirePermission("DEUDA.DEUDA.UPDATE"),
  validateParams(idSchema, logger, "deuda_update"),
  validateBody(updateSchema, logger, "deuda_update"),
  DeudaController.update
);

router.get(
  "/:id_deuda",
  requirePermission("DEUDA.DEUDA.READ"),
  validateParams(idSchema, logger, "deuda_get"),
  DeudaController.get
);

router.get(
  "/",
  requirePermission("DEUDA.DEUDA.READ"),
  validateQuery(querySchema, logger, "deuda_list"),
  DeudaController.list
);

module.exports = router;
