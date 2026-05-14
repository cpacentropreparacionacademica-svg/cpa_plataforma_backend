const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const EstudiantePadreController = require("../controller/estudiante_padre.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "estudiante_padre.router" });

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
} = require("../schemas/estudiante_padre.schema");

router.post(
  "/",
  requirePermission("PERSONAS.ESTUDIANTE_PADRE.CREATE"),
  validateBody(createSchema, logger, "estudiante_padre_creation"),
  EstudiantePadreController.create
);

router.put(
  "/:id_asociacion",
  requirePermission("PERSONAS.ESTUDIANTE_PADRE.UPDATE"),
  validateParams(idSchema, logger, "estudiante_padre_update"),
  validateBody(updateSchema, logger, "estudiante_padre_update"),
  EstudiantePadreController.update
);

router.get(
  "/:id_asociacion",
  requirePermission("PERSONAS.ESTUDIANTE_PADRE.READ"),
  validateParams(idSchema, logger, "estudiante_padre_get"),
  EstudiantePadreController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.ESTUDIANTE_PADRE.READ"),
  validateQuery(querySchema, logger, "estudiante_padre_list"),
  EstudiantePadreController.list
);

module.exports = router;
