const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const AsistenciaClaseCursoController = require("../controller/asistencia_clase_curso.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "asistencia_clase_curso.router" });

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
} = require("../schemas/asistencia_clase_curso.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.CREATE"),
  validateBody(createSchema, logger, "asistencia_clase_curso_creation"),
  AsistenciaClaseCursoController.create
);

router.put(
  "/:id_asistencia",
  requirePermission("SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.UPDATE"),
  validateParams(idSchema, logger, "asistencia_clase_curso_update"),
  validateBody(updateSchema, logger, "asistencia_clase_curso_update"),
  AsistenciaClaseCursoController.update
);

router.get(
  "/:id_asistencia",
  requirePermission("SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ"),
  validateParams(idSchema, logger, "asistencia_clase_curso_get"),
  AsistenciaClaseCursoController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.ASISTENCIA_CLASE_CURSO.READ"),
  validateQuery(querySchema, logger, "asistencia_clase_curso_list"),
  AsistenciaClaseCursoController.list
);

module.exports = router;
