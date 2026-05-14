const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ProductoEducativoController = require("../controller/producto_educativo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "producto_educativo.router" });

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
} = require("../schemas/producto_educativo.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.CREATE"),
  validateBody(createSchema, logger, "producto_educativo_creation"),
  ProductoEducativoController.create
);

router.put(
  "/:id_producto_educativo",
  requirePermission("SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.UPDATE"),
  validateParams(idSchema, logger, "producto_educativo_update"),
  validateBody(updateSchema, logger, "producto_educativo_update"),
  ProductoEducativoController.update
);

router.get(
  "/:id_producto_educativo",
  requirePermission("SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ"),
  validateParams(idSchema, logger, "producto_educativo_get"),
  ProductoEducativoController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.PRODUCTO_EDUCATIVO.READ"),
  validateQuery(querySchema, logger, "producto_educativo_list"),
  ProductoEducativoController.list
);

module.exports = router;
