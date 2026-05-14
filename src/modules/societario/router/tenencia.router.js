const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TenenciaController = require("../controller/tenencia.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "tenencia.router" });

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
} = require("../schemas/tenencia.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.TENENCIA.CREATE"),
  validateBody(createSchema, logger, "tenencia_creation"),
  TenenciaController.create
);

router.put(
  "/:id_tenencia",
  requirePermission("SOCIETARIO.TENENCIA.UPDATE"),
  validateParams(idSchema, logger, "tenencia_update"),
  validateBody(updateSchema, logger, "tenencia_update"),
  TenenciaController.update
);

router.get(
  "/:id_tenencia",
  requirePermission("SOCIETARIO.TENENCIA.READ"),
  validateParams(idSchema, logger, "tenencia_get"),
  TenenciaController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.TENENCIA.READ"),
  validateQuery(querySchema, logger, "tenencia_list"),
  TenenciaController.list
);

module.exports = router;
