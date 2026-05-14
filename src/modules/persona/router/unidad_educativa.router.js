const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const UnidadEducativaController = require("../controller/unidad_educativa.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "unidad_educativa.router" });

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
} = require("../schemas/unidad_educativa.schema");

router.post(
  "/",
  requirePermission("PERSONAS.UNIDAD_EDUCATIVA.CREATE"),
  validateBody(createSchema, logger, "unidad_educativa_creation"),
  UnidadEducativaController.create
);

router.put(
  "/:id_unidad_educativa",
  requirePermission("PERSONAS.UNIDAD_EDUCATIVA.UPDATE"),
  validateParams(idSchema, logger, "unidad_educativa_update"),
  validateBody(updateSchema, logger, "unidad_educativa_update"),
  UnidadEducativaController.update
);

router.get(
  "/:id_unidad_educativa",
  requirePermission("PERSONAS.UNIDAD_EDUCATIVA.READ"),
  validateParams(idSchema, logger, "unidad_educativa_get"),
  UnidadEducativaController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.UNIDAD_EDUCATIVA.READ"),
  validateQuery(querySchema, logger, "unidad_educativa_list"),
  UnidadEducativaController.list
);

module.exports = router;
