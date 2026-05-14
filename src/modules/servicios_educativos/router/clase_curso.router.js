const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ClaseCursoController = require("../controller/clase_curso.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "clase_curso.router" });

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
} = require("../schemas/clase_curso.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_CURSO.CREATE"),
  validateBody(createSchema, logger, "clase_curso_creation"),
  ClaseCursoController.create
);

router.put(
  "/:id_clase_curso",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_CURSO.UPDATE"),
  validateParams(idSchema, logger, "clase_curso_update"),
  validateBody(updateSchema, logger, "clase_curso_update"),
  ClaseCursoController.update
);

router.get(
  "/:id_clase_curso",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ"),
  validateParams(idSchema, logger, "clase_curso_get"),
  ClaseCursoController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_CURSO.READ"),
  validateQuery(querySchema, logger, "clase_curso_list"),
  ClaseCursoController.list
);

module.exports = router;
