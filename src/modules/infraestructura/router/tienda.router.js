const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TiendaController = require("../controller/tienda.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "tienda.router" });

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
} = require("../schemas/tienda.schema");

router.post(
  "/",
  requirePermission("INFRAESTRUCTURA.TIENDA.CREATE"),
  validateBody(createSchema, logger, "tienda_creation"),
  TiendaController.create
);

router.put(
  "/:id_tienda",
  requirePermission("INFRAESTRUCTURA.TIENDA.UPDATE"),
  validateParams(idSchema, logger, "tienda_update"),
  validateBody(updateSchema, logger, "tienda_update"),
  TiendaController.update
);

router.get(
  "/:id_tienda",
  requirePermission("INFRAESTRUCTURA.TIENDA.READ"),
  validateParams(idSchema, logger, "tienda_get"),
  TiendaController.get
);

router.get(
  "/",
  requirePermission("INFRAESTRUCTURA.TIENDA.READ"),
  validateQuery(querySchema, logger, "tienda_list"),
  TiendaController.list
);

module.exports = router;
