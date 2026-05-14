const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const HorariosController = require("../controller/horarios.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "horarios.router" });

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
} = require("../schemas/horarios.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.HORARIOS.CREATE"),
  validateBody(createSchema, logger, "horarios_creation"),
  HorariosController.create
);

router.put(
  "/:id_horario",
  requirePermission("SERVICIOS_EDUCATIVOS.HORARIOS.UPDATE"),
  validateParams(idSchema, logger, "horarios_update"),
  validateBody(updateSchema, logger, "horarios_update"),
  HorariosController.update
);

router.get(
  "/:id_horario",
  requirePermission("SERVICIOS_EDUCATIVOS.HORARIOS.READ"),
  validateParams(idSchema, logger, "horarios_get"),
  HorariosController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.HORARIOS.READ"),
  validateQuery(querySchema, logger, "horarios_list"),
  HorariosController.list
);

module.exports = router;
