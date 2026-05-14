const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ObjetivoKpiController = require("../controller/objetivo_kpi.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "objetivo_kpi.router" });

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
} = require("../schemas/objetivo_kpi.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.OBJETIVO_KPI.CREATE"),
  validateBody(createSchema, logger, "objetivo_kpi_creation"),
  ObjetivoKpiController.create
);

router.put(
  "/:id_objetivo_kpi",
  requirePermission("ADMINISTRACION.OBJETIVO_KPI.UPDATE"),
  validateParams(idSchema, logger, "objetivo_kpi_update"),
  validateBody(updateSchema, logger, "objetivo_kpi_update"),
  ObjetivoKpiController.update
);

router.get(
  "/:id_objetivo_kpi",
  requirePermission("ADMINISTRACION.OBJETIVO_KPI.READ"),
  validateParams(idSchema, logger, "objetivo_kpi_get"),
  ObjetivoKpiController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.OBJETIVO_KPI.READ"),
  validateQuery(querySchema, logger, "objetivo_kpi_list"),
  ObjetivoKpiController.list
);

module.exports = router;
