const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const GrupoCuentaController = require("../controller/grupo_cuenta.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "grupo_cuenta.router" });

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
} = require("../schemas/grupo_cuenta.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.GRUPO_CUENTA.CREATE"),
  validateBody(createSchema, logger, "grupo_cuenta_creation"),
  GrupoCuentaController.create
);

router.put(
  "/:id_grupo_cuenta",
  requirePermission("CONTABILIDAD.GRUPO_CUENTA.UPDATE"),
  validateParams(idSchema, logger, "grupo_cuenta_update"),
  validateBody(updateSchema, logger, "grupo_cuenta_update"),
  GrupoCuentaController.update
);

router.get(
  "/:id_grupo_cuenta",
  requirePermission("CONTABILIDAD.GRUPO_CUENTA.READ"),
  validateParams(idSchema, logger, "grupo_cuenta_get"),
  GrupoCuentaController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.GRUPO_CUENTA.READ"),
  validateQuery(querySchema, logger, "grupo_cuenta_list"),
  GrupoCuentaController.list
);

module.exports = router;
