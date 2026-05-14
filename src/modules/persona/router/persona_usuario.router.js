const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PersonaUsuarioController = require("../controller/persona_usuario.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "persona_usuario.router" });

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
} = require("../schemas/persona_usuario.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PERSONA_USUARIO.CREATE"),
  validateBody(createSchema, logger, "persona_usuario_creation"),
  PersonaUsuarioController.create
);

router.put(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA_USUARIO.UPDATE"),
  validateParams(idSchema, logger, "persona_usuario_update"),
  validateBody(updateSchema, logger, "persona_usuario_update"),
  PersonaUsuarioController.update
);

router.get(
  "/:id_persona",
  requirePermission("PERSONAS.PERSONA_USUARIO.READ"),
  validateParams(idSchema, logger, "persona_usuario_get"),
  PersonaUsuarioController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PERSONA_USUARIO.READ"),
  validateQuery(querySchema, logger, "persona_usuario_list"),
  PersonaUsuarioController.list
);

module.exports = router;
