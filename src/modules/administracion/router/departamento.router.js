const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const DepartamentoController = require("../controller/departamento.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "departamento.router" });

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
} = require("../schemas/departamento.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.DEPARTAMENTO.CREATE"),
  validateBody(createSchema, logger, "departamento_creation"),
  DepartamentoController.create
);

router.put(
  "/:id_departamento",
  requirePermission("ADMINISTRACION.DEPARTAMENTO.UPDATE"),
  validateParams(idSchema, logger, "departamento_update"),
  validateBody(updateSchema, logger, "departamento_update"),
  DepartamentoController.update
);

router.get(
  "/:id_departamento",
  requirePermission("ADMINISTRACION.DEPARTAMENTO.READ"),
  validateParams(idSchema, logger, "departamento_get"),
  DepartamentoController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.DEPARTAMENTO.READ"),
  validateQuery(querySchema, logger, "departamento_list"),
  DepartamentoController.list
);

module.exports = router;
