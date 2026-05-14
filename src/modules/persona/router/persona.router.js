const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PersonaController = require("../controller/persona.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "persona.router" });

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
} = require("../schemas/persona.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PERSONA.CREATE"),
  validateBody(createSchema, logger, "persona_creation"),
  PersonaController.create
);

router.put(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA.UPDATE"),
  validateParams(idSchema, logger, "persona_update"),
  validateBody(updateSchema, logger, "persona_update"),
  PersonaController.update
);

router.get(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA.READ"),
  validateParams(idSchema, logger, "persona_get"),
  PersonaController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PERSONA.READ"),
  validateQuery(querySchema, logger, "persona_list"),
  PersonaController.list
);

module.exports = router;
