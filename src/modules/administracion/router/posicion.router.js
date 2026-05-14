const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PosicionController = require("../controller/posicion.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "posicion.router" });

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
} = require("../schemas/posicion.schema");

router.post(
  "/",
  requirePermission("ADMINISTRACION.POSICION.CREATE"),
  validateBody(createSchema, logger, "posicion_creation"),
  PosicionController.create
);

router.put(
  "/:id_posicion",
  requirePermission("ADMINISTRACION.POSICION.UPDATE"),
  validateParams(idSchema, logger, "posicion_update"),
  validateBody(updateSchema, logger, "posicion_update"),
  PosicionController.update
);

router.get(
  "/:id_posicion",
  requirePermission("ADMINISTRACION.POSICION.READ"),
  validateParams(idSchema, logger, "posicion_get"),
  PosicionController.get
);

router.get(
  "/",
  requirePermission("ADMINISTRACION.POSICION.READ"),
  validateQuery(querySchema, logger, "posicion_list"),
  PosicionController.list
);

module.exports = router;
