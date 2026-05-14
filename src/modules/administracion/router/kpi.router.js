const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const KpiController = require("../controller/kpi.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "kpi.router" });

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
} = require("../schemas/kpi.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.KPI.CREATE"),
  validateBody(createSchema, logger, "kpi_creation"),
  KpiController.create
);

router.put(
  "/:id_kpi",
  requirePermission("ADMINISTRACION.KPI.UPDATE"),
  validateParams(idSchema, logger, "kpi_update"),
  validateBody(updateSchema, logger, "kpi_update"),
  KpiController.update
);

router.get(
  "/:id_kpi",
  requirePermission("ADMINISTRACION.KPI.READ"),
  validateParams(idSchema, logger, "kpi_get"),
  KpiController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.KPI.READ"),
  validateQuery(querySchema, logger, "kpi_list"),
  KpiController.list
);

module.exports = router;
