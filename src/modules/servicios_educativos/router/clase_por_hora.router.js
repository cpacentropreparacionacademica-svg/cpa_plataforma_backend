const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ClasePorHoraController = require("../controller/clase_por_hora.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "clase_por_hora.router" });

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
} = require("../schemas/clase_por_hora.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.CREATE"),
  validateBody(createSchema, logger, "clase_por_hora_creation"),
  ClasePorHoraController.create
);

router.put(
  "/:id_clase",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.UPDATE"),
  validateParams(idSchema, logger, "clase_por_hora_update"),
  validateBody(updateSchema, logger, "clase_por_hora_update"),
  ClasePorHoraController.update
);

router.get(
  "/:id_clase",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ"),
  validateParams(idSchema, logger, "clase_por_hora_get"),
  ClasePorHoraController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.CLASE_POR_HORA.READ"),
  validateQuery(querySchema, logger, "clase_por_hora_list"),
  ClasePorHoraController.list
);

module.exports = router;
