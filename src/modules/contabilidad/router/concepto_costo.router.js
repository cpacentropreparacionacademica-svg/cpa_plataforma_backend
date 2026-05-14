const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ConceptoCostoController = require("../controller/concepto_costo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "concepto_costo.router" });

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
} = require("../schemas/concepto_costo.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.CONCEPTO_COSTO.CREATE"),
  validateBody(createSchema, logger, "concepto_costo_creation"),
  ConceptoCostoController.create
);

router.put(
  "/:id_concepto",
  requirePermission("CONTABILIDAD.CONCEPTO_COSTO.UPDATE"),
  validateParams(idSchema, logger, "concepto_costo_update"),
  validateBody(updateSchema, logger, "concepto_costo_update"),
  ConceptoCostoController.update
);

router.get(
  "/:id_concepto",
  requirePermission("CONTABILIDAD.CONCEPTO_COSTO.READ"),
  validateParams(idSchema, logger, "concepto_costo_get"),
  ConceptoCostoController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.CONCEPTO_COSTO.READ"),
  validateQuery(querySchema, logger, "concepto_costo_list"),
  ConceptoCostoController.list
);

module.exports = router;
