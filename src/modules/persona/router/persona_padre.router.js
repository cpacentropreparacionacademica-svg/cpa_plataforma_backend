const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PersonaPadreController = require("../controller/persona_padre.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "persona_padre.router" });

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
} = require("../schemas/persona_padre.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PERSONA_PADRE.CREATE"),
  validateBody(createSchema, logger, "persona_padre_creation"),
  PersonaPadreController.create
);

router.put(
  "/:id_padre",
  requirePermission("PERSONAS.PERSONA_PADRE.UPDATE"),
  validateParams(idSchema, logger, "persona_padre_update"),
  validateBody(updateSchema, logger, "persona_padre_update"),
  PersonaPadreController.update
);

router.get(
  "/:id_padre",
  requirePermission("PERSONAS.PERSONA_PADRE.READ"),
  validateParams(idSchema, logger, "persona_padre_get"),
  PersonaPadreController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PERSONA_PADRE.READ"),
  validateQuery(querySchema, logger, "persona_padre_list"),
  PersonaPadreController.list
);

module.exports = router;
