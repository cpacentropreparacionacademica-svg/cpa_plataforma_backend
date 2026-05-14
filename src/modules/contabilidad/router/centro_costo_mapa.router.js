const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const CentroCostoMapaController = require("../controller/centro_costo_mapa.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "centro_costo_mapa.router" });

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
} = require("../schemas/centro_costo_mapa.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.CENTRO_COSTO_MAPA.CREATE"),
  validateBody(createSchema, logger, "centro_costo_mapa_creation"),
  CentroCostoMapaController.create
);

router.put(
  "/:id_cc_mapa",
  requirePermission("CONTABILIDAD.CENTRO_COSTO_MAPA.UPDATE"),
  validateParams(idSchema, logger, "centro_costo_mapa_update"),
  validateBody(updateSchema, logger, "centro_costo_mapa_update"),
  CentroCostoMapaController.update
);

router.get(
  "/:id_cc_mapa",
  requirePermission("CONTABILIDAD.CENTRO_COSTO_MAPA.READ"),
  validateParams(idSchema, logger, "centro_costo_mapa_get"),
  CentroCostoMapaController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.CENTRO_COSTO_MAPA.READ"),
  validateQuery(querySchema, logger, "centro_costo_mapa_list"),
  CentroCostoMapaController.list
);

module.exports = router;
