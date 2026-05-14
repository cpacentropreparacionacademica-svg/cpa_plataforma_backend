const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const PaquetesProductoEducativoController = require("../controller/paquetes_producto_educativo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "paquetes_producto_educativo.router" });

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
} = require("../schemas/paquetes_producto_educativo.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.CREATE"),
  validateBody(createSchema, logger, "paquetes_producto_educativo_creation"),
  PaquetesProductoEducativoController.create
);

router.put(
  "/:id_paquete",
  requirePermission("SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.UPDATE"),
  validateParams(idSchema, logger, "paquetes_producto_educativo_update"),
  validateBody(updateSchema, logger, "paquetes_producto_educativo_update"),
  PaquetesProductoEducativoController.update
);

router.get(
  "/:id_paquete",
  requirePermission("SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ"),
  validateParams(idSchema, logger, "paquetes_producto_educativo_get"),
  PaquetesProductoEducativoController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.PAQUETES_PRODUCTO_EDUCATIVO.READ"),
  validateQuery(querySchema, logger, "paquetes_producto_educativo_list"),
  PaquetesProductoEducativoController.list
);

module.exports = router;
