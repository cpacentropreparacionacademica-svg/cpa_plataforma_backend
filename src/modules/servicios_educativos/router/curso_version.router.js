const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const CursoVersionController = require("../controller/curso_version.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "curso_version.router" });

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
} = require("../schemas/curso_version.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CURSO_VERSION.CREATE"),
  validateBody(createSchema, logger, "curso_version_creation"),
  CursoVersionController.create
);

router.put(
  "/:id_curso_version",
  requirePermission("SERVICIOS_EDUCATIVOS.CURSO_VERSION.UPDATE"),
  validateParams(idSchema, logger, "curso_version_update"),
  validateBody(updateSchema, logger, "curso_version_update"),
  CursoVersionController.update
);

router.get(
  "/:id_curso_version",
  requirePermission("SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ"),
  validateParams(idSchema, logger, "curso_version_get"),
  CursoVersionController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CURSO_VERSION.READ"),
  validateQuery(querySchema, logger, "curso_version_list"),
  CursoVersionController.list
);

module.exports = router;
