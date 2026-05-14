const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const CentroCostoController = require("../controller/centro_costo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "centro_costo.router" });

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
} = require("../schemas/centro_costo.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.CENTRO_COSTO.CREATE"),
  validateBody(createSchema, logger, "centro_costo_creation"),
  CentroCostoController.create
);

router.put(
  "/:id_centro_costo",
  requirePermission("CONTABILIDAD.CENTRO_COSTO.UPDATE"),
  validateParams(idSchema, logger, "centro_costo_update"),
  validateBody(updateSchema, logger, "centro_costo_update"),
  CentroCostoController.update
);

router.get(
  "/:id_centro_costo",
  requirePermission("CONTABILIDAD.CENTRO_COSTO.READ"),
  validateParams(idSchema, logger, "centro_costo_get"),
  CentroCostoController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.CENTRO_COSTO.READ"),
  validateQuery(querySchema, logger, "centro_costo_list"),
  CentroCostoController.list
);

module.exports = router;
