const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const ArchivosTransaccionController = require("../controller/archivos_transaccion.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "archivos_transaccion.router" });

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
} = require("../schemas/archivos_transaccion.schema");

router.post(
  "/",
  requirePermission("CONTABILIDAD.ARCHIVOS_TRANSACCION.CREATE"),
  validateBody(createSchema, logger, "archivos_transaccion_creation"),
  ArchivosTransaccionController.create
);

router.put(
  "/:id_archivo",
  requirePermission("CONTABILIDAD.ARCHIVOS_TRANSACCION.UPDATE"),
  validateParams(idSchema, logger, "archivos_transaccion_update"),
  validateBody(updateSchema, logger, "archivos_transaccion_update"),
  ArchivosTransaccionController.update
);

router.get(
  "/:id_archivo",
  requirePermission("CONTABILIDAD.ARCHIVOS_TRANSACCION.READ"),
  validateParams(idSchema, logger, "archivos_transaccion_get"),
  ArchivosTransaccionController.get
);

router.get(
  "/",
  requirePermission("CONTABILIDAD.ARCHIVOS_TRANSACCION.READ"),
  validateQuery(querySchema, logger, "archivos_transaccion_list"),
  ArchivosTransaccionController.list
);

module.exports = router;
