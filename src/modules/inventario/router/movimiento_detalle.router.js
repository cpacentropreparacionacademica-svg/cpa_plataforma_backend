const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const MovimientoDetalleController = require("../controller/movimiento_detalle.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "movimiento_detalle.router" });

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
} = require("../schemas/movimiento_detalle.schema");

router.post(
  "/",
  requirePermission("INVENTARIO.MOVIMIENTO_DETALLE.CREATE"),
  validateBody(createSchema, logger, "movimiento_detalle_creation"),
  MovimientoDetalleController.create
);

router.put(
  "/:id_movimiento",
  requirePermission("INVENTARIO.MOVIMIENTO_DETALLE.UPDATE"),
  validateParams(idSchema, logger, "movimiento_detalle_update"),
  validateBody(updateSchema, logger, "movimiento_detalle_update"),
  MovimientoDetalleController.update
);

router.get(
  "/:id_movimiento",
  requirePermission("INVENTARIO.MOVIMIENTO_DETALLE.READ"),
  validateParams(idSchema, logger, "movimiento_detalle_get"),
  MovimientoDetalleController.get
);

router.get(
  "/",
  requirePermission("INVENTARIO.MOVIMIENTO_DETALLE.READ"),
  validateQuery(querySchema, logger, "movimiento_detalle_list"),
  MovimientoDetalleController.list
);

module.exports = router;
