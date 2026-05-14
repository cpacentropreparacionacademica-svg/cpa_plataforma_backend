const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PersonaEstudianteController = require("../controller/persona_estudiante.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "persona_estudiante.router" });

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
} = require("../schemas/persona_estudiante.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PERSONA_ESTUDIANTE.CREATE"),
  validateBody(createSchema, logger, "persona_estudiante_creation"),
  PersonaEstudianteController.create
);

router.put(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA_ESTUDIANTE.UPDATE"),
  validateParams(idSchema, logger, "persona_estudiante_update"),
  validateBody(updateSchema, logger, "persona_estudiante_update"),
  PersonaEstudianteController.update
);

router.get(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA_ESTUDIANTE.READ"),
  validateParams(idSchema, logger, "persona_estudiante_get"),
  PersonaEstudianteController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PERSONA_ESTUDIANTE.READ"),
  validateQuery(querySchema, logger, "persona_estudiante_list"),
  PersonaEstudianteController.list
);

module.exports = router;
