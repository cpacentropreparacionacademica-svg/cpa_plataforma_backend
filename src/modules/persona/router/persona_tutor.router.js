const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PersonaTutorController = require("../controller/persona_tutor.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "persona_tutor.router" });

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
} = require("../schemas/persona_tutor.schema");

router.post(
  "/",
  requirePermission("PERSONAS.PERSONA_TUTOR.CREATE"),
  validateBody(createSchema, logger, "persona_tutor_creation"),
  PersonaTutorController.create
);

router.put(
  "/:id_tutor",
  requirePermission("PERSONAS.PERSONA_TUTOR.UPDATE"),
  validateParams(idSchema, logger, "persona_tutor_update"),
  validateBody(updateSchema, logger, "persona_tutor_update"),
  PersonaTutorController.update
);

router.get(
  "/:id_tutor",
  requirePermission("PERSONAS.PERSONA_TUTOR.READ"),
  validateParams(idSchema, logger, "persona_tutor_get"),
  PersonaTutorController.get
);

router.get(
  "/",
  requirePermission("PERSONAS.PERSONA_TUTOR.READ"),
  validateQuery(querySchema, logger, "persona_tutor_list"),
  PersonaTutorController.list
);

module.exports = router;
